import React from 'react';
import { Film, Sparkles } from 'lucide-react';

const QuickStartFeatured = () => {
  const steps = [
    {
      id: 1,
      text: "Choose an AI tool from the menu",
      active: true,
    },
    {
      id: 2,
      text: "Upload your content or enter text",
      active: false,
    },
    {
      id: 3,
      text: "Let AI process your request",
      active: false,
    },
    {
      id: 4,
      text: "Download or copy your results",
      active: false,
    },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Quick Start Guide Section */}
      <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">
          Quick Start Guide
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/[0.02] border border-white/[0.04]"
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center text-xs sm:text-sm font-semibold shrink-0 border ${
                  step.active
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-[#18181b] text-zinc-500 border-zinc-700/50"
                }`}
              >
                {step.id}
              </div>
              <span
                className={`text-xs sm:text-sm ${
                  step.active ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                {step.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Tool Section */}
      <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="font-semibold text-white text-sm sm:text-base">
            Featured Tool
          </h3>
          <span className="px-2 py-1 rounded-md sm:rounded-lg bg-fuchsia-500/10 text-fuchsia-400 text-[10px] sm:text-xs font-medium">
            New
          </span>
        </div>
        
        <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/10 border border-fuchsia-500/20 p-4 sm:p-6 lg:h-[calc(100%-2.5rem)] flex flex-col justify-center">
          {/* Subtle glow effect */}
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/25 flex items-center justify-center text-white mb-3 sm:mb-4">
              <Film className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px]" />
            </div>
            
            <h4 className="text-base sm:text-lg font-semibold text-white mb-1.5 sm:mb-2">
              Faceless Video Script
            </h4>
            
            <p className="text-zinc-400 text-xs sm:text-sm mb-4 sm:mb-6 max-w-[280px]">
              Generate viral video scripts with scene breakdowns and visual descriptions.
            </p>
            
            <a
              href="/dashboard/tools/faceless-video"
              className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors text-xs sm:text-sm text-white font-medium shadow-lg shadow-purple-500/20"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Try Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStartFeatured;