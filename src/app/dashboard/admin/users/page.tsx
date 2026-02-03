'use client';

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AlertCircle, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type UserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
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

      const res = await fetch('/api/admin/users?perPage=50&page=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Forbidden');
        setLoading(false);
        return;
      }

      setRows(json.users || []);
      setLoading(false);
    })();
  }, [router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <Users className="h-5 w-5 text-emerald-300" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Users</h1>
          <p className="text-zinc-400">Registered users list (admin)</p>
        </div>
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
        ) : (
          <div className="space-y-2">
            {rows.map((u) => (
              <Link
                key={u.id}
                href={`/dashboard/admin/users/${u.id}`}
                className="block rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-white">{u.email ?? '(no email)'}</div>
                    <div className="mt-1 text-xs text-zinc-500 break-all">{u.id}</div>
                    {u.last_sign_in_at && <div className="mt-2 text-xs text-zinc-600">Last login: {u.last_sign_in_at}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-zinc-500">Joined: {u.created_at?.slice(0, 10)}</div>
                    <ChevronRight className="h-4 w-4 text-zinc-600" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
