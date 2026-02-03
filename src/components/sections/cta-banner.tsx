import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CTABanner() {
  return (
    <section className="relative py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-violet-600 to-blue-600" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/10 blur-[100px] rounded-full -translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-400/10 blur-[100px] rounded-full translate-x-1/4 translate-y-1/4" />
          
          <div className="relative z-10 py-16 px-8 md:py-20 md:px-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-white/90" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Start free today
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to Get Started?
            </h2>

            <p className="max-w-xl mx-auto text-lg text-white/80 mb-10">
              Join 250,000+ professionals who have already simplified their workflow with ToolkitHub.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 font-semibold h-12 px-8">
                  Enter Workspace
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <p className="text-sm text-white/60 mt-6">
              No credit card required
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
