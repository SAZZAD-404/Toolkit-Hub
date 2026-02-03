'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Finishing sign-in…');

  useEffect(() => {
    async function run() {
      try {
        if (!isSupabaseConfigured) {
          setStatus('Supabase is not configured.');
          return;
        }

        // Supabase OAuth returns a `code` in the URL. Exchange it for a session.
        const code = searchParams.get('code');
        if (!code) {
          setStatus('Sign-in failed: missing OAuth code in callback URL.');
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus(`Sign-in failed: ${error.message}`);
          return;
        }

        const next = searchParams.get('next') || '/dashboard';
        router.replace(next);
      } catch (e: any) {
        setStatus(`Sign-in failed: ${e?.message || 'Unknown error'}`);
      }
    }

    run();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6">
      <div className="text-zinc-300 text-sm">{status}</div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackInner />
    </Suspense>
  );
}
