'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, User } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type CreditsSummary = {
  total_available_now: number;
  monthly_quota: number;
};

const CircularProgress = ({ value, max, size = 36 }: { value: number; max: number; size?: number }) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(138, 43, 226, 0.2)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const HeroHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const [greeting, setGreeting] = useState('Welcome back');
  const [credits, setCredits] = useState<CreditsSummary | null>(null);
  const [notificationCount] = useState(3);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const fetchCredits = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setCredits({ total_available_now: 999, monthly_quota: 1000 });
      return;
    }

    let token: string | null = null;
    for (let i = 0; i < 20; i++) {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token ?? null;
      if (token) break;
      await new Promise((r) => setTimeout(r, 250));
    }

    if (!token) return;

    try {
      const res = await fetch('/api/credits/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setCredits(json as CreditsSummary);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Sazzad';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          <span className="text-foreground">{greeting}, </span>
          <span className="gradient-text-purple-cyan">{displayName}!</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here&apos;s what&apos;s happening with your AI toolkit</p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/credits"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-all group"
        >
          <div className="relative">
            <CircularProgress 
              value={credits?.total_available_now ?? 0} 
              max={credits?.monthly_quota ?? 1000} 
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-purple-400">
              {credits ? Math.round((credits.total_available_now / credits.monthly_quota) * 100) : 0}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Credits</span>
            <span className="text-sm font-semibold gradient-text-purple-cyan">
              {credits?.total_available_now?.toLocaleString() ?? '—'}
            </span>
          </div>
        </Link>

        <button className="relative p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all group">
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-purple-400 transition-colors" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-[10px] font-bold text-white flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        <div className="relative group">
          <button className="flex items-center gap-2 p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{avatarInitial}</span>
            </div>
          </button>
          
          <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl bg-card border border-purple-500/20 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <Link href="/dashboard/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-purple-500/10 transition-all">
              <User className="w-4 h-4" />
              Profile
            </Link>
            <hr className="my-2 border-purple-500/20" />
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start px-4 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroHeader;
