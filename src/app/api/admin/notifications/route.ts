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

  return { ok: true as const, adminUserId: u.user.id };
}

export async function POST(req: NextRequest) {
  const adm = await requireAdmin(req);
  if (!adm.ok) return adm.res;

  try {
    const { title, body } = await req.json();
    if (!title || !body) return NextResponse.json({ error: 'title and body are required' }, { status: 400 });

    const sb = serviceClient();

    // Log admin notification
    const { data: logRow, error: logErr } = await sb
      .from('admin_notifications')
      .insert({
        created_by: adm.adminUserId,
        title: String(title).trim(),
        body: String(body).trim(),
        audience: 'all',
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 });

    // Fan-out to all users
    let page = 1;
    const perPage = 200;
    let inserted = 0;

    while (true) {
      const { data: listData, error: listErr } = await sb.auth.admin.listUsers({ page, perPage });
      if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

      const users = listData?.users || [];
      if (users.length === 0) break;

      const batch = users.map(u => ({
        user_id: u.id,
        title: String(title).trim(),
        body: String(body).trim(),
      }));

      const { error: insErr } = await sb.from('user_notifications').insert(batch);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

      inserted += batch.length;

      if (users.length < perPage) break;
      page += 1;
    }

    return NextResponse.json({ success: true, adminNotificationId: logRow?.id, inserted });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to send notification' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const adm = await requireAdmin(req);
  if (!adm.ok) return adm.res;

  try {
    const sb = serviceClient();
    const { data, error } = await sb
      .from('admin_notifications')
      .select('id,title,body,audience,status,created_at,sent_at')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ notifications: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load notifications' }, { status: 500 });
  }
}
