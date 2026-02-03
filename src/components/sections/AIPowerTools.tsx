import React from 'react';
import { 
  Image as ImageIcon, 
  Film, 
  WandSparkles, 
  Video, 
  Type, 
  ScanText, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  shadowColor: string;
  href: string;
}

const ToolCard = ({ icon, title, description, gradient, shadowColor, href }: ToolCardProps) => (
  <a 
    href={href} 
    className="group glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 block transition-all duration-300 hover:border-white/10"
  >
    <div className="flex items-start gap-3 sm:gap-4">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${gradient} ${shadowColor} shadow-lg flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white text-sm sm:text-base mb-0.5 sm:mb-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 line-clamp-2">
          {description}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0 transition-all hidden sm:block group-hover:translate-x-1 group-hover:text-zinc-400" />
    </div>
  </a>
);

const AIPowerTools = () => {
  const tools = [
    {
      icon: <ImageIcon className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />,
      title: "AI Image Creator",
      description: "Generate stunning images with Flux AI",
      gradient: "from-pink-500 to-rose-500",
      shadowColor: "shadow-pink-500/25",
      href: "/dashboard/ai-image-creator"
    },
    {
      icon: <Film className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />,
      title: "Faceless Video Script",
      description: "Generate viral video scripts with scenes",
      gradient: "from-fuchsia-500 to-purple-600",
      shadowColor: "shadow-fuchsia-500/25",
      href: "/dashboard/faceless-video"
    },
    {
      icon: <WandSparkles className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />,
      title: "Prompt Redesigner",
      description: "Enhance your AI prompts",
      gradient: "from-amber-500 to-orange-500",
      shadowColor: "shadow-amber-500/25",
      href: "/dashboard/prompt-redesigner"
    },
    {
      icon: <Video className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />,
      title: "Text to Video",
      description: "Animate images into videos",
      gradient: "from-violet-500 to-purple-500",
      shadowColor: "shadow-violet-500/25",
      href: "/dashboard/image-to-video"
    },
    {
      icon: <Type className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />,
      title: "Video to Text",
      description: "Transcribe videos with WhisperLargeV3",
      gradient: "from-indigo-500 to-purple-500",
      shadowColor: "shadow-indigo-500/25",
      href: "/dashboard/video-to-text"
    },

  ];

  return (
    <section className="mb-6 sm:mb-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-0.5 sm:mb-1">
            AI Power Tools
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm">
            Powerful AI tools at your fingertips
          </p>
        </div>
        <a 
          href="/dashboard/ai-image-creator" 
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-all"
        >
          Explore All 
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {tools.map((tool, index) => (
          <ToolCard 
            key={index} 
            {...tool} 
          />
        ))}
      </div>

      {/* Grid for Quick Start and Featured Tool context - matching the site design layout */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
        {/* Quick Start Guide */}
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">
            Quick Start Guide
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {[
              { id: 1, text: "Choose an AI tool from the menu", active: true },
              { id: 2, text: "Upload your content or enter text", active: false },
              { id: 3, text: "Let AI process your request", active: false },
              { id: 4, text: "Download or copy your results", active: false }
            ].map((step) => (
              <div 
                key={step.id} 
                className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center text-xs sm:text-sm font-semibold shrink-0 border ${
                  step.active 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                    : "bg-zinc-800 text-zinc-500 border-zinc-700"
                }`}>
                  {step.id}
                </div>
                <span className={`text-xs sm:text-sm ${step.active ? "text-zinc-300" : "text-zinc-500"}`}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Tool */}
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-semibold text-white text-sm sm:text-base">Featured Tool</h3>
            <span className="px-2 py-1 rounded-md sm:rounded-lg bg-fuchsia-500/10 text-fuchsia-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">
              New
            </span>
          </div>
          <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/10 border border-fuchsia-500/20 p-4 sm:p-6">
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-fuchsia-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/25 flex items-center justify-center text-white mb-3 sm:mb-4">
                <Film className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px]" />
              </div>
              <h4 className="text-base sm:text-lg font-semibold text-white mb-1.5 sm:mb-2">
                Faceless Video Script
              </h4>
              <p className="text-zinc-400 text-xs sm:text-sm mb-3 sm:mb-4">
                Generate viral video scripts with scene breakdowns and visual descriptions.
              </p>
              <a 
                href="/dashboard/faceless-video" 
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm text-white font-medium bg-primary hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                Try Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIPowerTools;