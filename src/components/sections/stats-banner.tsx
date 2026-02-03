import React from 'react';
import { Zap, Users, TrendingUp, Globe } from 'lucide-react';

const StatsBanner = () => {
  const stats = [
    {
      label: "AI Tools",
      value: "15+",
      icon: <Zap className="w-5 h-5 text-white" />,
      gradient: "from-violet-500 to-purple-600",
      shadow: "shadow-violet-500/20"
    },
    {
      label: "Active Users",
      value: "250K",
      icon: <Users className="w-5 h-5 text-white" />,
      gradient: "from-cyan-500 to-sky-600",
      shadow: "shadow-cyan-500/20"
    },
    {
      label: "Uptime",
      value: "99.9%",
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      gradient: "from-emerald-500 to-green-600",
      shadow: "shadow-emerald-500/20"
    },
    {
      label: "Support",
      value: "24/7",
      icon: <Globe className="w-5 h-5 text-white" />,
      gradient: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-500/20"
    }
  ];

  return (
    <section id="features" className="relative py-20 overflow-hidden">
      {/* Background Glow Effect */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          background: "linear-gradient(to bottom, transparent, rgba(124, 58, 237, 0.05), transparent)" 
        }} 
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="group relative text-center p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300"
            >
              {/* Hover highlight background */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Icon Container */}
              <div 
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4 shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}
              >
                {stat.icon}
              </div>

              {/* Stat Value */}
              <div className="text-4xl md:text-5xl font-black mb-2 text-white tracking-tight group-hover:scale-105 transition-transform duration-300">
                {stat.value}
              </div>

              {/* Stat Label */}
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-white/40">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBanner;