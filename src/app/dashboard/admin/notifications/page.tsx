'use client';

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AlertCircle, Bell, CheckCircle2 } from 'lucide-react';

type LogRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  sent_at: string | null;
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);

  const loadLogs = async (token: string) => {
    const res = await fetch('/api/admin/notifications', { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (res.ok) setLogs(json.notifications || []);
  };

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        router.push('/dashboard');
        return;
      }
      await loadLogs(token);
    })();
  }, [router]);

  const send = async () => {
    setError(null);
    setSuccess(null);

    if (!title.trim() || !body.trim()) {
      setError('Title and message are required');
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Supabase not configured');
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      setError('Unauthorized');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');

      setTitle('');
      setBody('');
      setSuccess(`Sent to all users (${json.inserted ?? 0})`);
      await loadLogs(token);
    } catch (e: any) {
      setError(e?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <Bell className="h-5 w-5 text-amber-300" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Notifications</h1>
          <p className="text-zinc-400">Send in-app notifications to all users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-base font-bold text-white">Create notification</h2>
          <p className="mt-1 text-sm text-zinc-500">Broadcast to all users</p>

          <div className="mt-4 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full p-3 rounded-xl input-field text-sm"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Message"
              className="w-full min-h-40 p-3 rounded-xl input-field text-sm resize-none"
            />

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <button
              onClick={send}
              disabled={sending}
              className="w-full py-3.5 rounded-xl btn-primary disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send to all users'}
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-base font-bold text-white">Sent history</h2>
          <p className="mt-1 text-sm text-zinc-500">Last 30</p>

          <div className="mt-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-sm text-zinc-500">No notifications yet.</div>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <div className="text-sm font-semibold text-white">{l.title}</div>
                  <div className="mt-1 text-xs text-zinc-500 whitespace-pre-wrap">{l.body}</div>
                  <div className="mt-2 text-[11px] text-zinc-600">{(l.sent_at || l.created_at).slice(0, 19).replace('T', ' ')}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
