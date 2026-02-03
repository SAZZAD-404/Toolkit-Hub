'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AlertCircle, CheckCircle2, Clock, Copy } from 'lucide-react';

type Pack = {
  id: string;
  code: string;
  name: string;
  usd_price: number;
  credits: number;
  active: boolean;
};

type Topup = {
  id: string;
  status: string;
  wallet_network: string;
  tx_hash: string;
  amount: string | null;
  created_at: string;
  package_id: string;
};

type Wallet = { balance: number };

type CreditsSummary = {
  month_start: string;
  monthly_quota: number;
  free_used: number;
  free_remaining: number;
  wallet_balance: number;
  paid_used_month: number;
  total_used_month: number;
  total_available_now: number;
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

export default function CreditsPage() {
  const [packages, setPackages] = useState<Pack[]>([]);
  const [requests, setRequests] = useState<Topup[]>([]);
  const [wallet, setWallet] = useState<Wallet>({ balance: 0 });
  const [summary, setSummary] = useState<CreditsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [packageId, setPackageId] = useState<string>('');
  const [walletNetwork, setWalletNetwork] = useState<string>('USDT-TRC20');
  const [txHash, setTxHash] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
    document.title = 'Credits - ToolkitHub';
  }, []);

  const walletAddress = process.env.NEXT_PUBLIC_CRYPTO_WALLET_ADDRESS || 'YOUR_WALLET_ADDRESS_HERE';

  const chosen = useMemo(() => packages.find(p => p.id === packageId) || null, [packages, packageId]);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const packsRes = await fetch('/api/credits/packages');
      const packs = await packsRes.json();
      setPackages(packs.packages || []);
      if (!packageId && packs.packages?.[0]?.id) setPackageId(packs.packages[0].id);

      if (!isSupabaseConfigured) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // After refresh, Supabase session can take a moment to hydrate.
      let token: string | null = null;
      for (let i = 0; i < 20; i++) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token ?? null;
        if (token) break;
        await new Promise((r) => setTimeout(r, 250));
      }
      if (!token) {
        setRequests([]);
        setSummary(null);
        setError('Please login first');
        setLoading(false);
        return;
      }

      const reqRes = await fetch('/api/credits/topup', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const reqJson = await reqRes.json();
      setRequests(reqJson.requests || []);
      setWallet(reqJson.wallet || { balance: 0 });

      const sumRes = await fetch('/api/credits/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sumJson = await sumRes.json();
      if (sumRes.ok) {
        setSummary(sumJson);
      } else {
        setSummary(null);
        setError(sumJson?.error || 'Failed to load credits summary');
      }

    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    setError(null);
    setSuccess(null);

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured');
      return;
    }

    // Wait briefly for session hydration
    let token: string | null = null;
    for (let i = 0; i < 20; i++) {
      const { data: sessionData } = await supabase.auth.getSession();
      token = sessionData?.session?.access_token ?? null;
      if (token) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!token) {
      setError('Please login first');
      return;
    }

    if (!packageId || !walletNetwork || !txHash.trim()) {
      setError('Please select package, network, and provide tx hash');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/credits/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId,
          walletNetwork,
          txHash: txHash.trim(),
          amount: amount.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit');

      setTxHash('');
      setAmount('');
      setSuccess('Topup request submitted. Status: pending (admin will approve).');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const copyAddr = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setSuccess('Wallet address copied');
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Credits</h1>
        <p className="text-zinc-400">Top up via crypto. Your request stays pending until admin approves.</p>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-zinc-300">
          <div>
            Total available: <span className="font-semibold text-white">{loading ? '…' : (summary?.total_available_now ?? wallet.balance).toLocaleString()}</span> tokens
          </div>
          <div>
            Used this month: <span className="font-semibold text-white">{loading ? '…' : (summary?.total_used_month ?? 0).toLocaleString()}</span>
          </div>
          <div>
            Free remaining: <span className="font-semibold text-white">{loading ? '…' : (summary?.free_remaining ?? 0).toLocaleString()}</span>
          </div>
          <div>
            Paid wallet balance: <span className="font-semibold text-white">{loading ? '…' : wallet.balance.toLocaleString()}</span>
          </div>
        </div>
        {summary && (
          <div className="mt-1 text-xs text-zinc-500">
            Month: {summary.month_start} • Free used: {summary.free_used.toLocaleString()} • Paid used: {summary.paid_used_month.toLocaleString()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-base font-bold text-white">Buy credits (crypto)</h2>
          <p className="mt-1 text-sm text-zinc-500">Choose a package → pay → submit transaction hash</p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-500">Package</label>
              <select
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="mt-2 w-full p-3 rounded-xl input-field text-sm"
              >
                {packages.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#050505]">
                    ${p.usd_price} → {p.credits} tokens
                  </option>
                ))}
              </select>
              {chosen && (
                <div className="mt-2 text-xs text-zinc-500">Selected: <span className="text-zinc-300">{chosen.credits} tokens</span></div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-500">Network</label>
              <input
                value={walletNetwork}
                onChange={(e) => setWalletNetwork(e.target.value)}
                placeholder="USDT-TRC20"
                className="mt-2 w-full p-3 rounded-xl input-field text-sm"
              />
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Pay to address</div>
                  <div className="mt-1 text-sm text-white break-all">{walletAddress}</div>
                </div>
                <button
                  onClick={copyAddr}
                  className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-300 hover:text-white"
                  title="Copy"
                  type="button"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 text-xs text-zinc-600">Set NEXT_PUBLIC_CRYPTO_WALLET_ADDRESS in env to show your real address.</div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-500">Transaction hash</label>
              <input
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Paste tx hash"
                className="mt-2 w-full p-3 rounded-xl input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-500">Amount (optional)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="$2 / $5 / $10"
                className="mt-2 w-full p-3 rounded-xl input-field text-sm"
              />
            </div>

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
              onClick={submit}
              disabled={submitting || loading}
              className="w-full py-3.5 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting…' : 'Submit for approval'}
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-base font-bold text-white">Your requests</h2>
          <p className="mt-1 text-sm text-zinc-500">Latest 20 topups</p>

          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="text-sm text-zinc-500">Loading…</div>
            ) : requests.length === 0 ? (
              <div className="text-sm text-zinc-500">No requests yet.</div>
            ) : (
              requests.map(r => (
                <div key={r.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">{r.wallet_network}</div>
                    <div className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {timeAgo(r.created_at)}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 break-all">{r.tx_hash}</div>
                  <div className="mt-2 text-xs">
                    <span className={`inline-flex px-2 py-1 rounded-lg border ${
                      r.status === 'approved'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : r.status === 'rejected'
                          ? 'border-red-500/30 bg-red-500/10 text-red-200'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                    }`}>{r.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
