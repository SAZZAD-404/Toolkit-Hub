'use client';

import React from 'react';
import { 
  BarChart3, 
  Zap, 
  Users, 
  TrendingUp,
  Play,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const DashboardPreview = () => {
  const stats = [
    { label: 'Scripts Generated', value: '12.5K+', icon: BarChart3, color: 'text-blue-500' },
    { label: 'Active Users', value: '2.8K+', icon: Users, color: 'text-emerald-500' },
    { label: 'Success Rate', value: '98.7%', icon: TrendingUp, color: 'text-violet-500' },
    { label: 'AI Models', value: '5+', icon: Zap, color: 'text-amber-500' }
  ];

  const features = [
    'Ultra-realistic CGI specifications',
    'Multi-angle camera directions',
    'Seamless scene transitions',
    'Character consistency locks',
    'Professional narration'
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-foreground/80">Professional Dashboard</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Experience the Power of
            <span className="block mt-1 bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              AI Storytelling
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate cinematic faceless video scripts with our advanced AI platform. 
            Perfect for content creators who demand professional quality.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="p-5 rounded-xl bg-card border border-border/50 text-center">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-violet-500/10 to-blue-500/10 rounded-2xl blur-xl" />
          
          <div className="relative bg-card rounded-xl border border-border/50 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-blue-500/5 px-6 py-5 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Faceless Video Dashboard</h3>
                  <p className="text-sm text-muted-foreground">Professional script generation platform</p>
                </div>
                <Link href="/dashboard/faceless-video/generate">
                  <Button className="gap-2">
                    <Play className="w-4 h-4" />
                    Generate Script
                  </Button>
                </Link>
              </div>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-base font-semibold mb-4">Key Features</h4>
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-5 border border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                    <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
                    <div className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                  </div>
                  <div className="space-y-2.5">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                    <div className="h-6 bg-primary/10 rounded mt-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="gap-2">
              Try Dashboard Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
