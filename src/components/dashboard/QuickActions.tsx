'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wand2, AudioLines, FileText, Film, Sparkles, WandSparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const actions = [
  {
    title: 'Image Creator',
    href: '/dashboard/tools/image-creator',
    icon: Wand2,
    color: 'text-purple-400',
    glowColor: 'rgba(138, 43, 226, 0.5)',
    bgGradient: 'from-purple-500/25 to-purple-600/15',
    borderColor: 'rgba(138, 43, 226, 0.4)',
    requiresCredits: true,
  },
  {
    title: 'Text to Speech',
    href: '/dashboard/tools/text-to-speech',
    icon: AudioLines,
    color: 'text-cyan-400',
    glowColor: 'rgba(6, 182, 212, 0.5)',
    bgGradient: 'from-cyan-500/25 to-cyan-600/15',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    requiresCredits: true,
  },
  {
    title: 'Faceless Video',
    href: '/dashboard/tools/faceless-video',
    icon: Film,
    color: 'text-orange-400',
    glowColor: 'rgba(251, 146, 60, 0.5)',
    bgGradient: 'from-orange-500/25 to-orange-600/15',
    borderColor: 'rgba(251, 146, 60, 0.4)',
    requiresCredits: true,
  },
  {
    title: 'Summarizer',
    href: '/dashboard/tools/text-summarizer',
    icon: FileText,
    color: 'text-emerald-400',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    bgGradient: 'from-emerald-500/25 to-emerald-600/15',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    requiresCredits: true,
  },
  {
    title: 'Prompt Redesigner',
    href: '/dashboard/tools/prompt-redesigner',
    icon: WandSparkles,
    color: 'text-pink-400',
    glowColor: 'rgba(236, 72, 153, 0.5)',
    bgGradient: 'from-pink-500/25 to-pink-600/15',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    requiresCredits: true,
  },
  {
    title: 'More Tools',
    href: '/dashboard',
    icon: Sparkles,
    color: 'text-violet-400',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    bgGradient: 'from-violet-500/25 to-violet-600/15',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    requiresCredits: false,
  },
];

export default function QuickActions() {
  const router = useRouter();
  const [credits, setCredits] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const response = await fetch('/api/credits/summary');
      const data = await response.json();
      
      if (data.success) {
        setCredits(data);
      }
    } catch (error) {
      console.error('Error loading credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToolClick = async (action: any, e: React.MouseEvent) => {
    if (!action.requiresCredits) return;
    
    e.preventDefault();
    
    if (loading) {
      toast.error('Loading credit information...');
      return;
    }
    
    if (!credits) {
      toast.error('Unable to verify credits. Please try again.');
      return;
    }
    
    const totalCredits = (credits.monthlyCredits - credits.monthlyUsed) + credits.paidCredits;
    
    if (totalCredits <= 0) {
      toast.error('No credits available. Please purchase credits to continue.', {
        action: {
          label: 'Buy Credits',
          onClick: () => router.push('/dashboard/credits'),
        },
      });
      return;
    }
    
    // Navigate to the tool
    router.push(action.href);
  };

  return (
    <div 
      className="relative rounded-2xl p-6 h-full overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.7) 0%, rgba(10, 10, 20, 0.85) 100%)',
        border: '1px solid rgba(138, 43, 226, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 25px rgba(138, 43, 226, 0.1)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="h-11 w-11 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)',
            border: '1px solid rgba(138, 43, 226, 0.4)',
            boxShadow: '0 0 15px rgba(138, 43, 226, 0.2)',
          }}
        >
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          <p className="text-xs text-muted-foreground">Launch your favorite tools</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {actions.map((a) => (
          <Link
            key={a.href + a.title}
            href={a.href}
            onClick={(e) => handleToolClick(a, e)}
            className="group relative flex flex-col items-center justify-center gap-3 rounded-xl p-5 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            style={{
              background: `linear-gradient(135deg, rgba(30, 30, 50, 0.7) 0%, rgba(20, 20, 35, 0.8) 100%)`,
              border: `1px solid ${a.borderColor}`,
              boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3)`,
            }}
          >
            <div 
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                boxShadow: `0 0 30px ${a.glowColor}, inset 0 0 25px ${a.glowColor}`,
              }}
            />
            
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${a.glowColor} 0%, transparent 70%)`,
              }}
            />
            
            <div 
              className={`relative z-10 h-14 w-14 rounded-xl bg-gradient-to-br ${a.bgGradient} flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300`}
              style={{
                boxShadow: `0 0 20px ${a.glowColor.replace('0.5', '0.2')}`,
              }}
            >
              <a.icon className={`h-7 w-7 ${a.color} group-hover:drop-shadow-[0_0_10px_currentColor] transition-all`} />
            </div>
            <span className="relative z-10 text-sm font-medium text-foreground text-center group-hover:text-white transition-colors">{a.title}</span>
            
            {a.requiresCredits && credits && (
              <div className="absolute top-2 right-2 z-20">
                {((credits.monthlyCredits - credits.monthlyUsed) + credits.paidCredits) <= 0 ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
