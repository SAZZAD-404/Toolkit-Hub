'use client';

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AlertCircle, CreditCard, Clock, Copy } from 'lucide-react';

type Topup = {
  id: string;
  user_id: string;
  package_id: string;
  wallet_network: string;
  tx_hash: string;
  from_address: string | null;
  amount: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  approved_at: string | null;
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

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Topup[]>([]);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      router.push('/dashboard');
      return;
    }

    const res = await fetch(`/api/admin/topups?status=${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error || 'Forbidden');
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(json.topups || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [status]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setError(null);

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      setError('Unauthorized');
      return;
    }

    const res = await fetch('/api/admin/topups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, action, adminNote: note.trim() || null }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed');
      return;
    }

    setNote('');
    await load();
  };

  const copy = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-violet-300" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Payments</h1>
          <p className="text-zinc-400">Approve/reject crypto topups</p>
        </div>
        <div className="ml-auto">
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="p-3 rounded-xl input-field text-sm">
            <option value="pending" className="bg-[#050505]">Pending</option>
            <option value="approved" className="bg-[#050505]">Approved</option>
            <option value="rejected" className="bg-[#050505]">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-5">
        <div className="mb-4">
          <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-500">Admin note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-2 w-full p-3 rounded-xl input-field text-sm" placeholder="e.g. verified" />
        </div>

        {loading ? (
          <div className="text-sm text-zinc-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-zinc-500">No requests.</div>
        ) : (
          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{r.wallet_network}</div>
                    <div className="mt-1 text-xs text-zinc-500">User: <span className="text-zinc-300">{r.user_id}</span></div>
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {timeAgo(r.created_at)}</div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="text-xs text-zinc-500 break-all">TX: {r.tx_hash}</div>
                  <button onClick={() => copy(r.tx_hash)} className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-300 hover:text-white" title="Copy tx">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                {status === 'pending' && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => act(r.id, 'reject')} className="py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/15 transition text-sm font-semibold">Reject</button>
                    <button onClick={() => act(r.id, 'approve')} className="py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 hover:bg-emerald-500/15 transition text-sm font-semibold">Approve</button>
                  </div>
                )}

                {status !== 'pending' && r.admin_note && (
                  <div className="mt-2 text-xs text-zinc-600">Note: {r.admin_note}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
