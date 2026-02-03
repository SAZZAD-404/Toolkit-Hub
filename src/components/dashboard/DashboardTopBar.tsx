'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Sparkles, User } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function DashboardTopBar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState('User');
  const [notifications, setNotifications] = useState(0);
  const [realTimeInsight, setRealTimeInsight] = useState('');
  const [creditUsage, setCreditUsage] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    loadUserData();
    loadNotifications();
    loadCreditInsights();
  }, []);

  const loadUserData = async () => {
    if (!isSupabaseConfigured) {
      setUserName('Sazzad');
      return;
    }
    
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      const name = data.user.user_metadata?.full_name || 
                   data.user.user_metadata?.name || 
                   data.user.email?.split('@')[0] || 
                   'User';
      setUserName(name);
    }
  };

  const loadNotifications = async () => {
    if (!isSupabaseConfigured) return;
    
    try {
      const { data } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      setNotifications(data?.length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadCreditInsights = async () => {
    if (!isSupabaseConfigured) {
      setRealTimeInsight('Welcome to your AI toolkit dashboard');
      return;
    }

    try {
      const response = await fetch('/api/credits/summary');
      const data = await response.json();
      
      if (data.success) {
        setCreditUsage(data);
        generateRealTimeInsight(data);
      } else {
        setRealTimeInsight('Ready to create amazing content with AI');
      }
    } catch (error) {
      setRealTimeInsight('Your AI tools are ready to use');
    }
  };

  const generateRealTimeInsight = (data: any) => {
    const insights = [];
    
    if (data.monthlyCredits > 0) {
      const usagePercent = Math.round((data.monthlyUsed / data.monthlyCredits) * 100);
      if (usagePercent > 80) {
        insights.push(`You've used ${usagePercent}% of monthly credits`);
      } else if (usagePercent > 50) {
        insights.push(`${100 - usagePercent}% monthly credits remaining`);
      }
    }
    
    if (data.paidCredits > 0) {
      insights.push(`${data.paidCredits} paid credits available`);
    }
    
    if (data.totalUsed > 0) {
      insights.push(`${data.totalUsed} total generations completed`);
    }
    
    if (insights.length === 0) {
      insights.push('Ready to start your first AI generation');
    }
    
    setRealTimeInsight(insights[0]);
  };

  const handleNotificationsClick = () => {
    router.push('/dashboard/notifications');
  };

  const handleProfileClick = () => {
    router.push('/dashboard/profile');
  };

  return (
    <div 
      className="relative rounded-2xl p-5 mb-6 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.7) 0%, rgba(10, 10, 20, 0.85) 100%)',
        border: '1px solid rgba(138, 43, 226, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 30px rgba(138, 43, 226, 0.1)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(138, 43, 226, 0.5) 0%, transparent 70%)' }}
      />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">
            <span className="text-foreground">Welcome back, </span>
            <span className="gradient-text-purple-cyan">{userName}!</span>
          </h1>
          
          <div className="flex items-center gap-2 mt-2">
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                border: '1px solid rgba(138, 43, 226, 0.25)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-muted-foreground">{realTimeInsight}</span>
            </div>
          </div>
        </div>
        
          <div className="flex items-center gap-3">
            <button
              onClick={handleNotificationsClick}
              className="relative group h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.6) 0%, rgba(20, 20, 35, 0.7) 100%)',
                border: '1px solid rgba(138, 43, 226, 0.25)',
              }}
            >
              <div 
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: '0 0 20px rgba(138, 43, 226, 0.3)' }}
              />
              <Bell className="w-5 h-5 text-muted-foreground group-hover:text-purple-400 relative z-10 transition-colors" />
              {notifications > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)',
                    boxShadow: '0 0 10px rgba(138, 43, 226, 0.5)',
                  }}
                >
                  {notifications}
                </span>
              )}
            </button>
            
            <button
              onClick={handleProfileClick}
              className="relative group h-10 w-10 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)',
                boxShadow: '0 0 15px rgba(138, 43, 226, 0.4)',
              }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.2)' }}
              />
              <User className="w-5 h-5 text-white absolute inset-0 m-auto" />
            </button>
          </div>
      </div>
    </div>
  );
}
