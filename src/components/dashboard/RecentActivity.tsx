'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  Clock, 
  Zap,
  Image as ImageIcon,
  Film,
  Mic,
  FileText,
  Wand2,
  Link as LinkIcon,
  Mail,
  Activity,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';

type Row = {
  id: string;
  tool: string;
  action: string;
  status: string;
  created_at: string;
};

const toolConfig: Record<string, { icon: typeof Zap; gradient: string; borderColor: string; label: string; href: string }> = {
  'faceless-script': {
    icon: Film,
    gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    label: 'Faceless Video',
    href: '/dashboard/tools/faceless-video'
  },
  'image-creator': {
    icon: ImageIcon,
    gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    label: 'Image Creator',
    href: '/dashboard/tools/image-creator'
  },
  'text-to-speech': {
    icon: Mic,
    gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(219, 39, 119, 0.15) 100%)',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    label: 'Text to Speech',
    href: '/dashboard/tools/text-to-speech'
  },
  'prompt-redesigner': {
    icon: Wand2,
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    label: 'Prompt Redesigner',
    href: '/dashboard/tools/prompt-redesigner'
  },
  'text-summarizer': {
    icon: FileText,
    gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(22, 163, 74, 0.15) 100%)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    label: 'Text Summarizer',
    href: '/dashboard/tools/text-summarizer'
  },
  'url-shortener': {
    icon: LinkIcon,
    gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(8, 145, 178, 0.15) 100%)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    label: 'URL Shortener',
    href: '/dashboard/tools/url-shortener'
  },
  'temp-email': {
    icon: Mail,
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.15) 100%)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    label: 'Temp Email',
    href: '/dashboard/tools/temp-email'
  },
};

const defaultToolConfig = {
  icon: Zap,
  gradient: 'linear-gradient(135deg, rgba(138, 43, 226, 0.25) 0%, rgba(124, 58, 237, 0.15) 100%)',
  borderColor: 'rgba(138, 43, 226, 0.4)',
  label: 'Tool',
  href: '/dashboard'
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

function formatAction(action: string): string {
  const actionLabels: Record<string, string> = {
    'generate': 'Generated',
    'convert': 'Converted',
    'enhance': 'Enhanced',
    'summarize': 'Summarized',
    'create': 'Created',
    'shorten': 'Shortened',
  };
  return actionLabels[action] || action.charAt(0).toUpperCase() + action.slice(1);
}

export default function RecentActivity() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setRows([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }

    const { data: events } = await supabase
      .from('usage_events')
      .select('id,tool,action,status,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6);

    setRows(events ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActivity();

    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('realtime-activity')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'usage_events' },
        () => fetchActivity()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActivity]);

  const successCount = rows.filter(r => r.status === 'success').length;
  const totalCount = rows.length;

  return (
    <div 
      className="relative rounded-2xl overflow-hidden h-full flex flex-col"
      style={{
        background: 'linear-gradient(145deg, rgba(15, 15, 25, 0.95) 0%, rgba(8, 8, 16, 0.98) 100%)',
        border: '1px solid rgba(138, 43, 226, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px rgba(138, 43, 226, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/30 via-transparent to-cyan-500/20" />
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/30 via-transparent to-cyan-500/20" />
      
      <div 
        className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(138, 43, 226, 0.6) 0%, transparent 70%)' }}
      />
      <div 
        className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-[80px] opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.5) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 p-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div 
              className="h-12 w-12 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)',
                border: '1px solid rgba(138, 43, 226, 0.35)',
                boxShadow: '0 0 20px rgba(138, 43, 226, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              <Activity className="h-5 w-5 text-purple-400 relative z-10" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">Recent Activity</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Live generation history</p>
            </div>
          </div>
          
          {totalCount > 0 && (
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                {successCount}/{totalCount} success
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar">
        <div className="space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-4">
                <div 
                  className="animate-spin h-12 w-12 rounded-full"
                  style={{
                    border: '2px solid rgba(138, 43, 226, 0.1)',
                    borderTopColor: 'rgba(138, 43, 226, 0.8)',
                  }}
                />
                <div 
                  className="absolute inset-0 animate-ping rounded-full opacity-20"
                  style={{ background: 'rgba(138, 43, 226, 0.3)' }}
                />
                <Zap className="absolute inset-0 m-auto h-5 w-5 text-purple-400" />
              </div>
              <p className="text-sm text-zinc-500">Loading activity...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
                  border: '1px solid rgba(138, 43, 226, 0.2)',
                }}
              >
                <Clock className="w-7 h-7 text-purple-500/40" />
              </div>
              <p className="text-sm font-medium text-zinc-400">No activity yet</p>
              <p className="text-xs text-zinc-600 mt-1">Start using tools to see your history</p>
            </div>
            ) : (
              rows.map((r, idx) => {
                const config = toolConfig[r.tool] || defaultToolConfig;
                const ToolIcon = config.icon;
                const isSuccess = r.status === 'success';
                
                return (
                  <div
                    key={r.id}
                    onClick={() => router.push(config.href)}
                    className="group relative rounded-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, rgba(25, 25, 40, 0.8) 0%, rgba(15, 15, 28, 0.9) 100%)',
                      border: '1px solid rgba(138, 43, 226, 0.15)',
                      animationDelay: `${idx * 50}ms`,
                    }}
                  >
                  <div 
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                    style={{ 
                      boxShadow: '0 0 30px rgba(138, 43, 226, 0.12), inset 0 0 20px rgba(138, 43, 226, 0.03)',
                      border: '1px solid rgba(138, 43, 226, 0.3)',
                    }}
                  />
                  
                  <div className="relative z-10 flex items-center gap-4 p-4">
                    <div 
                      className="relative w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{
                        background: config.gradient,
                        border: `1px solid ${config.borderColor}`,
                        boxShadow: `0 0 15px ${config.borderColor.replace('0.4', '0.15')}`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                      <ToolIcon className="h-5 w-5 text-white relative z-10" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">
                          {config.label}
                        </span>
                        <div 
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide"
                          style={{
                            background: isSuccess 
                              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
                            border: isSuccess 
                              ? '1px solid rgba(16, 185, 129, 0.3)'
                              : '1px solid rgba(239, 68, 68, 0.3)',
                            color: isSuccess ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)',
                          }}
                        >
                          {isSuccess ? 'Success' : 'Failed'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500">
                          {formatAction(r.action)}
                        </span>
                        <span className="text-zinc-700">•</span>
                        <span className="text-xs text-zinc-600">
                          {timeAgo(r.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)',
                        border: '1px solid rgba(138, 43, 226, 0.25)',
                      }}
                    >
                      <ArrowUpRight className="w-4 h-4 text-purple-400" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {rows.length > 0 && (
        <div 
          className="relative z-10 px-6 py-4 border-t"
          style={{ borderColor: 'rgba(138, 43, 226, 0.15)' }}
        >
          <button 
            onClick={() => router.push('/dashboard/activity')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
              border: '1px solid rgba(138, 43, 226, 0.2)',
              color: 'rgba(168, 85, 247, 0.9)',
            }}
          >
            <Clock className="w-4 h-4" />
            View All Activity
          </button>
        </div>
      )}
    </div>
  );
}
