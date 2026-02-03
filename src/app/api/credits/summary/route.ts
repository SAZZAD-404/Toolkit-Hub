import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CREDIT_LIMIT_MONTHLY } from '@/lib/credits';

export const dynamic = 'force-dynamic';

function startOfMonthUTC(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function userClient(authHeader: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase is not configured');

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });

    const sb = userClient(auth);
    const { data: u, error: uErr } = await sb.auth.getUser();
    if (uErr || !u?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = u.user.id;
    const monthKey = isoDate(startOfMonthUTC());
    const monthStartIso = new Date(monthKey + 'T00:00:00.000Z').toISOString();

    // Free monthly credits
    const { data: creditsRow, error: cErr } = await sb
      .from('user_credits')
      .select('monthly_quota, used')
      .eq('user_id', userId)
      .eq('month_start', monthKey)
      .maybeSingle();

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

    const monthlyQuota = Number(creditsRow?.monthly_quota ?? CREDIT_LIMIT_MONTHLY);
    const freeUsed = Number(creditsRow?.used ?? 0);
    const freeRemaining = Math.max(monthlyQuota - freeUsed, 0);

    // Paid wallet balance
    const { data: walletRow, error: wErr } = await sb
      .from('user_wallet')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 });

    const walletBalance = Math.max(Number(walletRow?.balance ?? 0), 0);

    // Used paid credits this month: sum(meta.walletCharge) from usage_events
    const { data: events, error: eErr } = await sb
      .from('usage_events')
      .select('credits, meta, created_at')
      .eq('user_id', userId)
      .gte('created_at', monthStartIso)
      .order('created_at', { ascending: false })
      .limit(5000);

    if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });

    let paidUsed = 0;
    let totalUsed = 0;

    for (const ev of events ?? []) {
      const c = Number((ev as any).credits ?? 0);
      if (c > 0) totalUsed += c;
      const walletCharge = Number((ev as any).meta?.walletCharge ?? 0);
      if (walletCharge > 0) paidUsed += walletCharge;
    }

    // All-time used credits (lifetime)
    // NOTE: PostgREST aggregates may be disabled depending on Supabase settings.
    // Avoid aggregate errors; compute only month-based usage here.
    const totalUsedLifetime = null;

    // Determine plan
    // - free: no approved topups ever
    // - standard: has approved topups
    // - pro: bought >= $10 OR bought >= 6000 credits total
    const { data: approvedTopups, error: tErr } = await sb
      .from('credit_topups')
      .select('id, status, package:credit_packages(code, credits, usd_price)')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(200);

    if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

    let purchasedCredits = 0;
    let purchasedUsd = 0;
    let boughtPack10 = false;

    for (const t of approvedTopups ?? []) {
      const pkg: any = (t as any).package;
      purchasedCredits += Number(pkg?.credits ?? 0);
      purchasedUsd += Number(pkg?.usd_price ?? 0);
      if (String(pkg?.code ?? '') === 'pack_10') boughtPack10 = true;
    }

    const plan = purchasedCredits > 0 ? (boughtPack10 || purchasedUsd >= 10 || purchasedCredits >= 6000 ? 'pro' : 'standard') : 'free';

    const totalAvailableNow = freeRemaining + walletBalance;

    return NextResponse.json({
      month_start: monthKey,
      monthly_quota: monthlyQuota,
      free_used: freeUsed,
      free_remaining: freeRemaining,
      wallet_balance: walletBalance,
      paid_used_month: paidUsed,
      total_used_month: totalUsed,
      total_used_lifetime: totalUsedLifetime,
      total_available_now: totalAvailableNow,
      plan,
      purchased_credits_total: purchasedCredits,
      purchased_usd_total: purchasedUsd,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load credits summary' }, { status: 500 });
  }
}
