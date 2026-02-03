'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AlertCircle, ArrowLeft, CreditCard, History, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

type UserDetails = {
  user: { id: string; email: string | null; created_at: string; last_sign_in_at: string | null };
  wallet: { balance: number };
  credits: { month_start: string; monthly_quota: number; used: number };
  topups: Array<any>;
  events: Array<any>;
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

export default function AdminUserDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [data, setData] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const remainingFree = useMemo(() => {
    if (!data) return null;
    return Math.max((data.credits.monthly_quota ?? 100) - (data.credits.used ?? 0), 0);
  }, [data]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      if (!id) {
        setError('Missing user id');
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured) {
        setError('Supabase not configured');
        setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        router.push('/dashboard');
        return;
      }

      const res = await fetch(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load');
        setLoading(false);
        return;
      }

      setData(json);
      setLoading(false);
    })();
  }, [id, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin/users" className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white">User details</h1>
            <p className="text-zinc-400">{id}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">User</p>
              <p className="mt-2 text-sm font-semibold text-white break-all">{loading ? '—' : (data?.user.email ?? '(no email)')}</p>
              <p className="mt-1 text-xs text-zinc-600">Joined: {loading ? '—' : data?.user.created_at?.slice(0, 10)}</p>
              {data?.user.last_sign_in_at && <p className="mt-1 text-xs text-zinc-600">Last login: {data.user.last_sign_in_at}</p>}
            </div>
            <div className="h-11 w-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-emerald-300" />
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Free credits (month)</p>
              <p className="mt-2 text-2xl font-black text-white">{loading || remainingFree == null ? '—' : remainingFree.toLocaleString()}</p>
              {data && (
                <p className="mt-1 text-sm text-zinc-500">{data.credits.used} used of {data.credits.monthly_quota} (month start {data.credits.month_start})</p>
              )}
            </div>
            <div className="h-11 w-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-violet-300" />
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Wallet (paid)</p>
              <p className="mt-2 text-2xl font-black text-white">{loading ? '—' : (data?.wallet.balance ?? 0).toLocaleString()}</p>
              <p className="mt-1 text-sm text-zinc-500">Token balance</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <History className="h-5 w-5 text-cyan-300" />
            </div>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-base font-bold text-white">Recent topups</h2>
          <p className="mt-1 text-sm text-zinc-500">Last 20</p>

          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="text-sm text-zinc-500">Loading…</div>
            ) : (data?.topups?.length ?? 0) === 0 ? (
              <div className="text-sm text-zinc-500">No topups.</div>
            ) : (
              data!.topups.map((t: any) => (
                <div key={t.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">{t.wallet_network}</div>
                    <div className="text-xs text-zinc-500">{t.status}</div>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 break-all">{t.tx_hash}</div>
                  <div className="mt-2 text-[11px] text-zinc-600">{timeAgo(t.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-base font-bold text-white">Recent usage</h2>
          <p className="mt-1 text-sm text-zinc-500">Last 30 runs</p>

          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="text-sm text-zinc-500">Loading…</div>
            ) : (data?.events?.length ?? 0) === 0 ? (
              <div className="text-sm text-zinc-500">No usage yet.</div>
            ) : (
              data!.events.map((e: any) => (
                <div key={e.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">{e.tool}</div>
                    <div className="text-xs text-zinc-500">{e.status} · {e.credits} credits</div>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{e.action}</div>
                  <div className="mt-2 text-[11px] text-zinc-600">{timeAgo(e.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
