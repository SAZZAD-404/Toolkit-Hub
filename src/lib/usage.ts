import { createClient } from '@supabase/supabase-js';
import { CREDIT_LIMIT_MONTHLY, creditsForTool } from './credits';

function startOfMonthUTC(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function supabaseFromAuthHeader(authHeader: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase is not configured');

  // Use user JWT for RLS.
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function supabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  // Service role bypasses RLS (server-side only). Use ONLY in API routes.
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getUserId(sb: ReturnType<typeof createClient>) {
  const { data: u, error } = await sb.auth.getUser();
  if (error || !u?.user) return null;
  return u.user.id;
}

export async function checkCredits(opts: {
  req: Request;
  tool: string;
}): Promise<
  | { ok: true; creditsNeeded: number; remaining: number; monthKey: string }
  | { ok: false; status: number; error: string; creditsNeeded: number; remaining: number }
> {

  const auth = opts.req.headers.get('authorization');
  if (!auth) {
    return { ok: false, status: 401, error: 'Missing Authorization header', creditsNeeded: creditsForTool(opts.tool), remaining: 0 };
  }

  const sb = supabaseFromAuthHeader(auth);
  const userId = await getUserId(sb as any);
  if (!userId) {
    return { ok: false, status: 401, error: 'Unauthorized', creditsNeeded: creditsForTool(opts.tool), remaining: 0 };
  }

  const creditsNeeded = creditsForTool(opts.tool);
  const monthKey = isoDate(startOfMonthUTC());

  const { data: row, error } = await sb
    .from('user_credits')
    .select('monthly_quota, used')
    .eq('user_id', userId)
    .eq('month_start', monthKey)
    .maybeSingle();

  if (error) {
    const msg = String(error.message ?? 'Credit check failed');
    const isMissingTable = /does not exist|42P01/i.test(msg);
    return {
      ok: false,
      status: 500,
      error: isMissingTable
        ? 'Credits tables are not set up in Supabase yet. Run migrations: supabase/migrations/003_dashboard_usage.sql and 004_credit_topups.sql'
        : msg,
      creditsNeeded,
      remaining: 0,
    };
  }

  const quota = row?.monthly_quota ?? CREDIT_LIMIT_MONTHLY;
  const used = row?.used ?? 0;
  const freeRemaining = Math.max(quota - used, 0);

  // Paid balance (wallet)
  const { data: wRow, error: wErr } = await sb
    .from('user_wallet')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (wErr) {
    const msg = String(wErr.message ?? 'Credit check failed');
    const isMissingTable = /does not exist|42P01/i.test(msg);
    return {
      ok: false,
      status: 500,
      error: isMissingTable
        ? 'Credits wallet table is not set up in Supabase yet. Run migration: supabase/migrations/004_credit_topups.sql'
        : msg,
      creditsNeeded,
      remaining: 0,
    };
  }

  const wallet = Math.max(Number(wRow?.balance ?? 0), 0);
  const remaining = freeRemaining + wallet;

  if (remaining < creditsNeeded) {
    return { ok: false, status: 402, error: 'Credit limit reached', creditsNeeded, remaining };
  }

  return { ok: true, creditsNeeded, remaining, monthKey };
}

export async function hasChargedGeneration(opts: {
  req: Request;
  tool: string;
  generationId: string;
}): Promise<boolean> {
  const auth = opts.req.headers.get('authorization');
  if (!auth) return false;

  const sbUser = supabaseFromAuthHeader(auth);
  const userId = await getUserId(sbUser as any);
  if (!userId) return false;

  const sbAdmin = supabaseAdmin();
  const sb = sbAdmin ?? sbUser;

  const { data, error } = await sb
    .from('usage_events')
    .select('id')
    .eq('user_id', userId)
    .eq('tool', opts.tool)
    .eq('status', 'success')
    .gt('credits', 0)
    .contains('meta', { generationId: opts.generationId })
    .limit(1);

  if (error) {
    console.error('hasChargedGeneration: failed to query usage_events', error);
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}

export async function logUsageAndCharge(opts: {
  req: Request;
  tool: string;
  action?: string;
  status: 'success' | 'error';
  credits: number; // 0 allowed
  meta?: any;
}): Promise<void> {
  const auth = opts.req.headers.get('authorization');
  if (!auth) return;

  const sbUser = supabaseFromAuthHeader(auth);
  const userId = await getUserId(sbUser as any);
  if (!userId) return;

  const sbAdmin = supabaseAdmin();
  const sb = sbAdmin ?? sbUser;

  const monthKey = isoDate(startOfMonthUTC());

  // Charge credits (free monthly first, then wallet balance)
  if (opts.credits > 0) {
    // Ensure monthly row exists
    const { data: row, error: rowErr } = await sb
      .from('user_credits')
      .select('monthly_quota, used')
      .eq('user_id', userId)
      .eq('month_start', monthKey)
      .maybeSingle();

    if (rowErr) {
      console.error('logUsageAndCharge: failed to read user_credits', rowErr);
      // Don't throw; still attempt to log usage event.
    }

    const quota = row?.monthly_quota ?? CREDIT_LIMIT_MONTHLY;
    const used = row?.used ?? 0;
    const freeRemaining = Math.max(quota - used, 0);

    const freeCharge = Math.min(freeRemaining, opts.credits);
    const walletCharge = Math.max(opts.credits - freeCharge, 0);

    if (!row) {
      const { error: insErr } = await sb.from('user_credits').insert({
        user_id: userId,
        month_start: monthKey,
        monthly_quota: quota,
        used: freeCharge,
      });

      if (insErr) {
        // Some DBs may accidentally have a UNIQUE(user_id) constraint (instead of PK(user_id, month_start)).
        // In that case the insert fails with 23505 even though this month's row doesn't exist.
        // Fallback: update the existing row for the user to the current month and add usage.
        const code = (insErr as any).code;
        if (code === '23505') {
          console.warn('logUsageAndCharge: user_credits insert hit duplicate constraint; falling back to update-by-user_id. Fix DB schema to PK(user_id, month_start).');

          const { data: anyRow, error: anyRowErr } = await sb
            .from('user_credits')
            .select('month_start, monthly_quota, used')
            .eq('user_id', userId)
            .order('month_start', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (anyRowErr) {
            console.error('logUsageAndCharge: fallback read user_credits failed', anyRowErr);
          } else {
            const prevUsed = Number((anyRow as any)?.used ?? 0);
            const newUsed = prevUsed + freeCharge;
            const { error: fbUpdErr } = await sb
              .from('user_credits')
              .update({ month_start: monthKey, monthly_quota: quota, used: newUsed })
              .eq('user_id', userId);
            if (fbUpdErr) console.error('logUsageAndCharge: fallback update user_credits failed', fbUpdErr);
          }
        } else {
          console.error('logUsageAndCharge: failed to insert user_credits', insErr);
        }
      }
    } else if (freeCharge > 0) {
      const { error: updErr } = await sb
        .from('user_credits')
        .update({ used: used + freeCharge })
        .eq('user_id', userId)
        .eq('month_start', monthKey);
      if (updErr) console.error('logUsageAndCharge: failed to update user_credits', updErr);
    }

    if (walletCharge > 0) {
      // Ensure wallet row exists
      const { data: wRow, error: wReadErr } = await sb
        .from('user_wallet')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (wReadErr) console.error('logUsageAndCharge: failed to read user_wallet', wReadErr);

      const bal = Math.max(Number(wRow?.balance ?? 0), 0);
      const newBal = Math.max(bal - walletCharge, 0);

      if (!wRow) {
        // If wallet doesn't exist but we need to charge, create it with 0 then charge => 0.
        const { error: wInsErr } = await sb.from('user_wallet').insert({ user_id: userId, balance: newBal });
        if (wInsErr) console.error('logUsageAndCharge: failed to insert user_wallet', wInsErr);
      } else {
        const { error: wUpdErr } = await sb.from('user_wallet').update({ balance: newBal }).eq('user_id', userId);
        if (wUpdErr) console.error('logUsageAndCharge: failed to update user_wallet', wUpdErr);
      }
    }

    // Attach charge split to meta
    opts.meta = { ...(opts.meta ?? {}), freeCharge, walletCharge };
  }

  const { error: evErr } = await sb.from('usage_events').insert({
    user_id: userId,
    tool: opts.tool,
    action: opts.action ?? 'run',
    status: opts.status,
    credits: opts.credits,
    meta: opts.meta ?? {},
  });
  if (evErr) console.error('logUsageAndCharge: failed to insert usage_events', evErr);

}
