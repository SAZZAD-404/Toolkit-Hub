import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function userClient(authHeader: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anon) throw new Error('Supabase is not configured');
  return createClient(supabaseUrl, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });

    const sb = userClient(auth);
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await sb
      .from('user_notifications')
      .select('id,title,body,read_at,created_at')
      .eq('user_id', u.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const unread = (data ?? []).filter(n => !n.read_at).length;
    return NextResponse.json({ notifications: data ?? [], unread });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load notifications' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });

    const { id, markAllRead } = await req.json();

    const sb = userClient(auth);
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date().toISOString();

    if (markAllRead) {
      const { error } = await sb
        .from('user_notifications')
        .update({ read_at: now })
        .eq('user_id', u.user.id)
        .is('read_at', null);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { error } = await sb
      .from('user_notifications')
      .update({ read_at: now })
      .eq('id', id)
      .eq('user_id', u.user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update notifications' }, { status: 500 });
  }
}
