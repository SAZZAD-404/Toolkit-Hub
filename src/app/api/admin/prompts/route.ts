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
  const userId = u?.user?.id;
  if (!u?.user || !userId) return { ok: false as const, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!isAdminEmail(email)) return { ok: false as const, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };

  return { ok: true as const, userId };
}

export async function GET(req: NextRequest) {
  const adm = await requireAdmin(req);
  if (!adm.ok) return adm.res;

  const url = new URL(req.url);
  const niche = url.searchParams.get('niche');

  const sb = serviceClient();
  let q = sb.from('script_prompts').select('id,niche,title,prompt_text,active,created_at,updated_at').order('updated_at', { ascending: false });
  if (niche) q = q.eq('niche', niche);

  const { data, error } = await q.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prompts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const adm = await requireAdmin(req);
  if (!adm.ok) return adm.res;

  try {
    const { niche, title, promptText } = await req.json();
    if (!niche || !title || !promptText) return NextResponse.json({ error: 'niche, title, promptText are required' }, { status: 400 });

    const sb = serviceClient();

    // Prefer inserting user_id (some schemas enforce NOT NULL). If the column doesn't exist, retry without it.
    let insertPayload: any = { niche: String(niche), title: String(title), prompt_text: String(promptText), active: true, user_id: adm.userId };
    let { data, error } = await sb.from('script_prompts').insert(insertPayload).select('id').single();

    if (error && /column\s+"user_id"\s+does not exist/i.test(error.message)) {
      insertPayload = { niche: String(niche), title: String(title), prompt_text: String(promptText), active: true };
      ({ data, error } = await sb.from('script_prompts').insert(insertPayload).select('id').single());
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data?.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create prompt' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const adm = await requireAdmin(req);
  if (!adm.ok) return adm.res;

  try {
    const { id, title, promptText, active } = await req.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const patch: any = { updated_at: new Date().toISOString() };
    if (typeof title === 'string') patch.title = title;
    if (typeof promptText === 'string') patch.prompt_text = promptText;
    if (typeof active === 'boolean') patch.active = active;

    const sb = serviceClient();
    const { error } = await sb.from('script_prompts').update(patch).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update prompt' }, { status: 500 });
  }
}
