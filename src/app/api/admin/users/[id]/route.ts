import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

function serviceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase service role is not configured');
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function userClient(authHeader: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anon) throw new Error('Supabase is not configured');
  return createClient(supabaseUrl, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function requireAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return { ok: false as const, res: NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 }) };

  const sbUser = userClient(auth);
  const { data: u } = await sbUser.auth.getUser();
  const email = u?.user?.email;
  if (!u?.user) return { ok: false as const, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!isAdminEmail(email)) return { ok: false as const, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };

  return { ok: true as const };
}

function startOfMonthUTC(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const adm = await requireAdmin(req);
  if (!adm.ok) return adm.res;

  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });

    const sb = serviceClient();

    // Auth user
    const { data: userRes, error: uErr } = await sb.auth.admin.getUserById(id);
    if (uErr || !userRes?.user) return NextResponse.json({ error: uErr?.message || 'User not found' }, { status: 404 });

    const user = userRes.user;

    // Wallet balance
    const { data: walletRow } = await sb
      .from('user_wallet')
      .select('balance')
      .eq('user_id', id)
      .maybeSingle();

    // Current month free credits
    const monthKey = isoDate(startOfMonthUTC());
    const { data: creditsRow } = await sb
      .from('user_credits')
      .select('monthly_quota, used, month_start')
      .eq('user_id', id)
      .eq('month_start', monthKey)
      .maybeSingle();

    // Recent topups
    const { data: topups } = await sb
      .from('credit_topups')
      .select('id,status,wallet_network,tx_hash,amount,created_at,approved_at,admin_note,package_id')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Recent usage events
    const { data: events } = await sb
      .from('usage_events')
      .select('id,tool,action,status,credits,meta,created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(30);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: (user as any).last_sign_in_at || null,
      },
      wallet: { balance: Number(walletRow?.balance ?? 0) },
      credits: {
        month_start: monthKey,
        monthly_quota: Number(creditsRow?.monthly_quota ?? 100),
        used: Number(creditsRow?.used ?? 0),
      },
      topups: topups ?? [],
      events: events ?? [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load user details' }, { status: 500 });
  }
}
