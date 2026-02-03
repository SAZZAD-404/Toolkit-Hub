import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

function serviceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase service role is not configured');
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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

async function requireAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return { ok: false as const, res: NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 }) };

  const sbUser = userClient(auth);
  const { data: u, error: uErr } = await sbUser.auth.getUser();
  if (uErr || !u?.user) return { ok: false as const, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const email = u.user.email;
  if (!isAdminEmail(email)) return { ok: false as const, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };

  return { ok: true as const, adminUserId: u.user.id };
}

export async function GET(req: NextRequest) {
  const adm = await requireAdmin(req);
  if (!adm.ok) return adm.res;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'pending';

    const sb = serviceClient();
    const { data, error } = await sb
      .from('credit_topups')
      .select('id,user_id,package_id,wallet_network,tx_hash,from_address,amount,status,admin_note,created_at,approved_at')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ topups: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load topups' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const adm = await requireAdmin(req);
  if (!adm.ok) return adm.res;

  try {
    const { id, action, adminNote } = await req.json();
    if (!id || !action) return NextResponse.json({ error: 'id and action are required' }, { status: 400 });
    if (!['approve', 'reject'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    const sb = serviceClient();

    const { data: topup, error: tErr } = await sb
      .from('credit_topups')
      .select('id,user_id,package_id,status')
      .eq('id', id)
      .single();

    if (tErr || !topup) return NextResponse.json({ error: tErr?.message || 'Topup not found' }, { status: 404 });
    if (topup.status !== 'pending') return NextResponse.json({ error: 'Topup is not pending' }, { status: 409 });

    if (action === 'reject') {
      const { error } = await sb
        .from('credit_topups')
        .update({ status: 'rejected', admin_note: adminNote ?? null, approved_by: adm.adminUserId, approved_at: new Date().toISOString() })
        .eq('id', id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // approve: add credits to user_wallet
    const { data: pkg, error: pErr } = await sb
      .from('credit_packages')
      .select('credits')
      .eq('id', topup.package_id)
      .single();

    if (pErr || !pkg) return NextResponse.json({ error: pErr?.message || 'Package not found' }, { status: 500 });

    // Upsert wallet
    const { data: wRow } = await sb
      .from('user_wallet')
      .select('balance')
      .eq('user_id', topup.user_id)
      .maybeSingle();

    const bal = Math.max(Number(wRow?.balance ?? 0), 0);
    const newBal = bal + Number(pkg.credits || 0);

    if (!wRow) {
      const { error: insErr } = await sb.from('user_wallet').insert({ user_id: topup.user_id, balance: newBal });
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    } else {
      const { error: upErr } = await sb.from('user_wallet').update({ balance: newBal }).eq('user_id', topup.user_id);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { error: aErr } = await sb
      .from('credit_topups')
      .update({ status: 'approved', admin_note: adminNote ?? null, approved_by: adm.adminUserId, approved_at: new Date().toISOString() })
      .eq('id', id);

    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

    return NextResponse.json({ success: true, newBalance: newBal });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update topup' }, { status: 500 });
  }
}
