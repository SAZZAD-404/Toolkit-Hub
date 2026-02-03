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

export async function GET(req: NextRequest) {
  const adm = await requireAdmin(req);
  if (!adm.ok) return adm.res;

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const perPage = Math.min(Math.max(parseInt(url.searchParams.get('perPage') || '20', 10), 1), 100);

    const sb = serviceClient();
    const { data, error } = await sb.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const users = (data?.users || []).map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: (u as any).last_sign_in_at || null,
    }));

    return NextResponse.json({ users, page, perPage });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to list users' }, { status: 500 });
  }
}
