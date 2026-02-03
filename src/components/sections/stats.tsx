import React from 'react';
import { Zap, Users, TrendingUp, Globe } from 'lucide-react';

const StatsSection = () => {
  const stats = [
    {
      icon: Zap,
      value: "15+",
      label: "AI Tools",
      description: "Comprehensive toolkit",
      color: "text-violet-500",
      bg: "bg-violet-500/10"
    },
    {
      icon: Users,
      value: "250K",
      label: "Active Users",
      description: "Growing community",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      icon: TrendingUp,
      value: "99.9%",
      label: "Uptime",
      description: "Reliable service",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      icon: Globe,
      value: "24/7",
      label: "Support",
      description: "Always available",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    }
  ];

  return (
    <section id="features" className="relative py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-xl bg-card border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg"
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${stat.bg} mb-4`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              
              <div className="text-sm font-semibold text-foreground mb-0.5">
                {stat.label}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
