'use client';

import React from 'react';
import { 
  Cpu, 
  Shield, 
  Globe, 
  Database,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const Ecosystem = () => {
  const features = [
    {
      icon: Cpu,
      title: "Multi-AI Integration",
      description: "Powered by Gemini 2.0, Groq Llama 3.3, OpenRouter, and GitHub Models",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption with secure API key management and failover systems",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      icon: Globe,
      title: "Global Scale",
      description: "99.9% uptime with worldwide CDN and intelligent load balancing",
      color: "text-violet-500",
      bg: "bg-violet-500/10"
    },
    {
      icon: Database,
      title: "Smart Caching",
      description: "Advanced caching system for faster response times and cost optimization",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    }
  ];

  const integrations = [
    { name: "Gemini 2.0", status: "Primary" },
    { name: "Groq Llama", status: "Active" },
    { name: "OpenRouter", status: "Active" },
    { name: "GitHub Models", status: "Active" },
    { name: "Supabase", status: "Database" },
    { name: "Vercel", status: "Hosting" }
  ];

  const architectureFeatures = [
    "Intelligent AI provider routing",
    "Automatic failover & recovery",
    "Real-time performance monitoring",
    "Advanced caching & optimization"
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-foreground/80">Powerful Ecosystem</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Built for
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              {" "}Scale & Performance
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform is built on enterprise-grade infrastructure with multiple AI providers, 
            intelligent failover systems, and world-class security standards.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="p-5 rounded-xl bg-card border border-border/50 hover:border-border transition-all duration-300">
              <div className={`inline-flex p-2.5 rounded-lg ${feature.bg} mb-4`}>
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border/50 overflow-hidden mb-16">
          <div className="p-6 md:p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-bold">Enterprise Architecture</h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  Our platform uses a sophisticated multi-provider architecture with intelligent 
                  routing, automatic failover, and real-time monitoring to ensure maximum reliability.
                </p>
                
                <div className="space-y-3 mb-6">
                  {architectureFeatures.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                <Link href="/dashboard">
                  <Button className="gap-2">
                    View Architecture
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-4">Active Integrations</h4>
                <div className="grid grid-cols-2 gap-3">
                  {integrations.map((integration, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div>
                        <div className="text-sm font-medium">{integration.name}</div>
                        <div className="text-xs text-muted-foreground">{integration.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "AI Models", value: "5+", desc: "Integrated providers" },
            { label: "Uptime", value: "99.9%", desc: "Guaranteed availability" },
            { label: "Response", value: "<2s", desc: "Average API response" },
            { label: "Security", value: "SOC2", desc: "Compliance ready" }
          ].map((stat, index) => (
            <div key={index} className="text-center p-5 rounded-xl bg-card border border-border/50">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="font-medium text-sm mb-0.5">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;
