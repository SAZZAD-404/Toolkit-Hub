'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { TrendingUp, Activity, TrendingDown, Minus } from 'lucide-react';

type CreditsSummary = {
  month_start: string;
  monthly_quota: number;
  free_used: number;
  free_remaining: number;
  wallet_balance: number;
  paid_used_month: number;
  total_used_month: number;
  total_available_now: number;
  plan?: string;
};

type UsageEvent = {
  credits?: number;
  created_at: string;
};

function CircularProgress({ 
  value, 
  max, 
  size = 80, 
  strokeWidth = 6,
  gradientId 
}: { 
  value: number; 
  max: number; 
  size?: number;
  strokeWidth?: number;
  gradientId: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(value / max, 1);
  const offset = circumference - percent * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="progress-ring" width={size} height={size}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(138, 43, 226, 0.15)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ 
            transition: 'stroke-dashoffset 1s ease-out',
            filter: 'drop-shadow(0 0 6px rgba(138, 43, 226, 0.5))'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] text-muted-foreground font-medium">
          {Math.round(percent * 100)}%
        </span>
      </div>
    </div>
  );
}

function MiniSparkline({ data, color, id }: { data: number[]; color: string; id: string }) {
  if (data.length < 2) {
    return (
      <svg width={60} height={24} className="opacity-60">
        <line x1="0" y1="12" x2="60" y2="12" stroke={color} strokeWidth="2" strokeOpacity="0.3" />
      </svg>
    );
  }
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-60">
      <defs>
        <linearGradient id={`sparkline-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={`url(#sparkline-${id})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function OverviewStats() {
  const [summary, setSummary] = useState<CreditsSummary | null>(null);
  const [usedCreditsLifetime, setUsedCreditsLifetime] = useState<number>(0);
  const [totalRuns, setTotalRuns] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [creditsTrend, setCreditsTrend] = useState<number[]>([]);
  const [runsTrend, setRunsTrend] = useState<number[]>([]);
  const [creditsChange, setCreditsChange] = useState<number>(0);
  const [runsChange, setRunsChange] = useState<number>(0);

  const fetchData = useCallback(async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      setSummary(null);
      setTotalRuns(0);
      setUsedCreditsLifetime(0);
      setCreditsTrend([]);
      setRunsTrend([]);
      setCreditsChange(0);
      setRunsChange(0);
      setLoading(false);
      return;
    }

    let token: string | null = null;
    for (let i = 0; i < 20; i++) {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token ?? null;
      if (token) break;
      await new Promise((r) => setTimeout(r, 250));
    }

    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id ?? null;

    if (!token || !userId) {
      setSummary(null);
      setTotalRuns(0);
      setUsedCreditsLifetime(0);
      setCreditsTrend([]);
      setRunsTrend([]);
      setCreditsChange(0);
      setRunsChange(0);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/credits/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setSummary(json as CreditsSummary);

      const { count } = await supabase
        .from('usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { data: rows } = await supabase
        .from('usage_events')
        .select('credits, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5000);

      const events = (rows ?? []) as UsageEvent[];
      const used = events.reduce((sum, r) => sum + Number(r?.credits ?? 0), 0);

      setTotalRuns(count ?? 0);
      setUsedCreditsLifetime(used);

      // Calculate trends for the last 7 days
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const dailyCredits: number[] = [];
      const dailyRuns: number[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const dayEvents = events.filter(e => {
          const eventDate = new Date(e.created_at);
          return eventDate >= dayStart && eventDate < dayEnd;
        });
        
        dailyCredits.push(dayEvents.reduce((sum, e) => sum + Number(e.credits ?? 0), 0));
        dailyRuns.push(dayEvents.length);
      }
      
      setCreditsTrend(dailyCredits);
      setRunsTrend(dailyRuns);
      
      // Calculate week-over-week change
      const thisWeekCredits = events
        .filter(e => new Date(e.created_at) >= sevenDaysAgo)
        .reduce((sum, e) => sum + Number(e.credits ?? 0), 0);
      
      const lastWeekCredits = events
        .filter(e => {
          const d = new Date(e.created_at);
          return d >= fourteenDaysAgo && d < sevenDaysAgo;
        })
        .reduce((sum, e) => sum + Number(e.credits ?? 0), 0);
      
      const thisWeekRuns = events.filter(e => new Date(e.created_at) >= sevenDaysAgo).length;
      const lastWeekRuns = events.filter(e => {
        const d = new Date(e.created_at);
        return d >= fourteenDaysAgo && d < sevenDaysAgo;
      }).length;
      
      if (lastWeekCredits > 0) {
        setCreditsChange(Math.round(((thisWeekCredits - lastWeekCredits) / lastWeekCredits) * 100));
      } else if (thisWeekCredits > 0) {
        setCreditsChange(100);
      } else {
        setCreditsChange(0);
      }
      
      if (lastWeekRuns > 0) {
        setRunsChange(Math.round(((thisWeekRuns - lastWeekRuns) / lastWeekRuns) * 100));
      } else if (thisWeekRuns > 0) {
        setRunsChange(100);
      } else {
        setRunsChange(0);
      }
      
    } catch {
      setSummary(null);
      setTotalRuns(0);
      setUsedCreditsLifetime(0);
      setCreditsTrend([]);
      setRunsTrend([]);
      setCreditsChange(0);
      setRunsChange(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('realtime-usage')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'usage_events' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const creditsAvailable = summary?.total_available_now ?? 0;
  const creditsMax = summary?.monthly_quota ?? 1000;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div
        className="relative group rounded-2xl p-6 transition-all duration-500 overflow-hidden hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.7) 0%, rgba(10, 10, 20, 0.85) 100%)',
          border: '1px solid rgba(138, 43, 226, 0.35)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 30px rgba(138, 43, 226, 0.15)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(138, 43, 226, 0.2) 0%, transparent 70%)',
            boxShadow: 'inset 0 0 40px rgba(138, 43, 226, 0.1)',
          }}
        />
        
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
              Credits Available
            </p>
            <p className="text-5xl font-bold tabular-nums gradient-text-purple-cyan mb-1">
              {loading ? '—' : creditsAvailable.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              of {creditsMax.toLocaleString()} monthly
            </p>
          </div>
          <CircularProgress 
            value={creditsAvailable} 
            max={creditsMax} 
            gradientId="credits-ring"
          />
        </div>
        
        <div 
          className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}
        />
      </div>
      
      <div
        className="relative group rounded-2xl p-6 transition-all duration-500 overflow-hidden hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.7) 0%, rgba(10, 10, 20, 0.85) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 25px rgba(16, 185, 129, 0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          }}
        />
        
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Credits Used
            </p>
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-5xl font-bold tabular-nums text-foreground mb-2">
            {loading ? '—' : usedCreditsLifetime.toLocaleString()}
          </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {creditsChange !== 0 ? (
                  <>
                    <span className={`flex items-center gap-1 text-xs font-medium ${creditsChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {creditsChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {creditsChange > 0 ? '+' : ''}{creditsChange}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs last week</span>
                  </>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Minus className="w-3 h-3" />
                    No change
                  </span>
                )}
              </div>
              <MiniSparkline 
                data={creditsTrend} 
                color="#10b981"
                id="credits"
              />
          </div>
        </div>
      </div>
      
      <div
        className="relative group rounded-2xl p-6 transition-all duration-500 overflow-hidden hover:scale-[1.02] pulse-glow"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.7) 0%, rgba(10, 10, 20, 0.85) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 25px rgba(6, 182, 212, 0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          }}
        />
        
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Total Runs
            </p>
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
              }}
            >
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <p className="text-5xl font-bold tabular-nums text-foreground mb-2">
            {loading ? '—' : totalRuns.toLocaleString()}
          </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {runsChange !== 0 ? (
                  <>
                    <span className={`flex items-center gap-1 text-xs font-medium ${runsChange > 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                      {runsChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {runsChange > 0 ? '+' : ''}{runsChange}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs last week</span>
                  </>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Minus className="w-3 h-3" />
                    No change
                  </span>
                )}
              </div>
              <MiniSparkline 
                data={runsTrend} 
                color="#06b6d4"
                id="runs"
              />
          </div>
        </div>
        
        <div 
          className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
          style={{ 
            background: '#06b6d4',
            boxShadow: '0 0 10px #06b6d4, 0 0 20px #06b6d4'
          }}
        />
      </div>
    </section>
  );
}
