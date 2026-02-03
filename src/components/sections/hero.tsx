import React from 'react';
import { ArrowRight, Play, Sparkles, Zap, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]" />

      <div className="relative z-10 container mx-auto px-6 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-8">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20">
              <Sparkles className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground/80">AI-Powered Platform v3.0</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
            Every AI Tool You Need,
            <span className="block mt-2 bg-gradient-to-r from-primary via-violet-500 to-blue-500 bg-clip-text text-transparent">
              One Unified Platform
            </span>
          </h1>

          <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
            Stop juggling multiple AI subscriptions. ToolkitHub combines 15+ AI tools, 
            dev utilities, and business solutions into one seamless workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
            <Link href="/dashboard">
              <Button size="lg" className="h-12 px-8 text-base font-semibold">
                Start Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              <Play className="w-4 h-4 mr-2 fill-current" />
              Watch Demo
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 mb-16">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" />
              <span>Instant Setup</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4 text-primary" />
              <span>99.9% Uptime</span>
            </div>
          </div>

          <div className="relative w-full max-w-5xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-violet-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-60" />
            
            <div className="relative rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-muted text-xs text-muted-foreground font-mono">
                    toolkithub.app/dashboard
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12 min-h-[400px]">
                <div className="hidden md:flex col-span-3 flex-col border-r border-border/50 p-4 bg-muted/20">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold">Dashboard</span>
                  </div>
                  <div className="space-y-1">
                    {['AI Image Creator', 'Faceless Video', 'Prompt Designer', 'Text to Speech'].map((item) => (
                      <div key={item} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
                        <div className="w-7 h-7 rounded-md bg-muted" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-9 p-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    {[
                      { val: '15+', label: 'Tools' },
                      { val: '5', label: 'AI Models' },
                      { val: '10K+', label: 'Users' },
                      { val: '<2s', label: 'Response' }
                    ].map((stat) => (
                      <div key={stat.label} className="p-3 rounded-lg bg-muted/40 border border-border/50 text-center">
                        <p className="text-xl font-bold text-foreground">{stat.val}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {[
                      { title: 'AI Image Creator', desc: 'Generate stunning visuals', color: 'from-pink-500 to-rose-500' },
                      { title: 'Faceless Video', desc: 'Create viral scripts', color: 'from-violet-500 to-purple-500' },
                      { title: 'Prompt Designer', desc: 'Enhance AI prompts', color: 'from-amber-500 to-orange-500' },
                      { title: 'Video to Text', desc: 'AI transcription', color: 'from-cyan-500 to-blue-500' }
                    ].map((feat) => (
                      <div key={feat.title} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feat.color} flex items-center justify-center shadow-sm`}>
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{feat.title}</p>
                          <p className="text-xs text-muted-foreground">{feat.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center gap-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Trusted by teams worldwide</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
              {['Google', 'Meta', 'Netflix', 'Spotify', 'Uber'].map((brand) => (
                <span key={brand} className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
