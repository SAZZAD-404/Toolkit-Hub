'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let unsub: { data?: { subscription: { unsubscribe: () => void } } } | null = null;

    async function run() {
      if (!isSupabaseConfigured || !supabase?.auth) {
        // If Supabase isn't configured, don't block the app.
        setChecking(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        const next = encodeURIComponent(pathname || '/dashboard');
        router.replace(`/login?next=${next}`);
        return;
      }

      setChecking(false);

      unsub = supabase.auth.onAuthStateChange((_event: any, newSession: any) => {
        if (!newSession) {
          const next = encodeURIComponent(pathname || '/dashboard');
          router.replace(`/login?next=${next}`);
        }
      });
    }

    run();

    return () => {
      try {
        unsub?.data?.subscription?.unsubscribe();
      } catch {}
    };
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Checking session…</div>
      </div>
    );
  }

  return <>{children}</>;
}
