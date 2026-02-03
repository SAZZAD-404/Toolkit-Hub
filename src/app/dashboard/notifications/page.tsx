'use client';

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AlertCircle, Bell, CheckCircle2 } from 'lucide-react';

type Notif = {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const [rows, setRows] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setRows([]);
      setUnread(0);
      setLoading(false);
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      setRows([]);
      setUnread(0);
      setLoading(false);
      return;
    }

    const res = await fetch('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed to load');
      setLoading(false);
      return;
    }

    setRows(json.notifications || []);
    setUnread(json.unread || 0);
    setLoading(false);
  };

  useEffect(() => {
    document.title = 'Notifications - ToolkitHub';
    load();
  }, []);

  const markAllRead = async () => {
    setError(null);
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return;

    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ markAllRead: true }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed');
      return;
    }
    await load();
  };

  const markRead = async (id: string) => {
    setError(null);
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return;

    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed');
      return;
    }
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <Bell className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Notifications</h1>
            <p className="text-zinc-400">Unread: {unread}</p>
          </div>
        </div>

        <button onClick={markAllRead} className="px-4 py-2.5 rounded-xl btn-secondary text-sm">Mark all read</button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-5">
        {loading ? (
          <div className="text-sm text-zinc-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-zinc-500">No notifications yet.</div>
        ) : (
          <div className="space-y-2">
            {rows.map(n => (
              <div key={n.id} className={`rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 ${n.read_at ? '' : 'ring-1 ring-amber-500/20'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-white">{n.title}</div>
                    <div className="mt-1 text-xs text-zinc-500 whitespace-pre-wrap">{n.body}</div>
                    <div className="mt-2 text-[11px] text-zinc-600">{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.read_at && (
                    <button onClick={() => markRead(n.id)} className="h-10 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
