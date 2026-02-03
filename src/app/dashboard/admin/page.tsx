'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, Users, Bell, CreditCard, Sparkles, ArrowRight } from 'lucide-react';

export default function AdminHomePage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured) {
        setAllowed(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        router.push('/dashboard');
        return;
      }

      const res = await fetch('/api/admin/me', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setAllowed(!!json.isAdmin);
      if (!json.isAdmin) router.push('/dashboard');
    })();
  }, [router]);

  if (allowed === null) {
    return <div className="text-sm text-zinc-500">Loading…</div>;
  }

  if (!allowed) {
    return null;
  }

  const cards = [
    {
      title: 'Users',
      desc: 'View registered users',
      href: '/dashboard/admin/users',
      icon: Users,
      color: 'text-emerald-300',
    },
    {
      title: 'Notifications',
      desc: 'Send in-app notifications (all users)',
      href: '/dashboard/admin/notifications',
      icon: Bell,
      color: 'text-amber-300',
    },
    {
      title: 'Payments',
      desc: 'Approve crypto topups',
      href: '/dashboard/admin/payments',
      icon: CreditCard,
      color: 'text-violet-300',
    },
    {
      title: 'Script Prompts',
      desc: 'Manage niche prompts (add/edit/disable)',
      href: '/dashboard/admin/prompts',
      icon: Sparkles,
      color: 'text-cyan-300',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
        <Shield className="h-3.5 w-3.5" /> Admin only
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-white">Admin dashboard</h1>
        <p className="text-zinc-400">Manage users, notifications, payments and script prompts.</p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group glass-panel rounded-2xl p-5 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition"
          >
            <div className="flex items-center justify-between">
              <div className="h-11 w-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300" />
            </div>
            <div className="mt-4 text-sm font-semibold text-white">{c.title}</div>
            <div className="mt-1 text-xs text-zinc-500">{c.desc}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
