import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function userClient(authHeader: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase is not configured');

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });

    const { packageId, walletNetwork, txHash, fromAddress, amount } = await req.json();

    if (!packageId || !walletNetwork || !txHash) {
      return NextResponse.json({ error: 'packageId, walletNetwork, txHash are required' }, { status: 400 });
    }

    const sb = userClient(auth);
    const { data: u, error: uErr } = await sb.auth.getUser();
    if (uErr || !u?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Basic txHash sanity
    const cleanTx = String(txHash).trim();
    if (cleanTx.length < 10) {
      return NextResponse.json({ error: 'Invalid txHash' }, { status: 400 });
    }

    const { data, error } = await sb.from('credit_topups').insert({
      user_id: u.user.id,
      package_id: packageId,
      wallet_network: String(walletNetwork).trim(),
      tx_hash: cleanTx,
      from_address: fromAddress ? String(fromAddress).trim() : null,
      amount: amount ? String(amount).trim() : null,
      status: 'pending',
    }).select('id,status,created_at').single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, request: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create topup request' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });

    const sb = userClient(auth);
    const { data: u, error: uErr } = await sb.auth.getUser();
    if (uErr || !u?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await sb
      .from('credit_topups')
      .select('id,status,wallet_network,tx_hash,amount,created_at,package_id')
      .eq('user_id', u.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Also return current paid wallet balance (for UI + debugging)
    const { data: walletRow, error: wErr } = await sb
      .from('user_wallet')
      .select('balance')
      .eq('user_id', u.user.id)
      .maybeSingle();

    if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 });

    return NextResponse.json({
      requests: data ?? [],
      wallet: { balance: Number(walletRow?.balance ?? 0) },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load topup requests' }, { status: 500 });
  }
}
