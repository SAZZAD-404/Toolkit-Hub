'use client';

import React from 'react';
import { 
  Image as ImageIcon, 
  Film, 
  WandSparkles, 
  Video, 
  Volume2,
  Clapperboard,
  FileVideo,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Tool {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  href: string;
  category: string;
}

const tools: Tool[] = [
  {
    title: "AI Image Creator",
    description: "Generate stunning images with Flux AI",
    icon: <ImageIcon size={20} />,
    gradient: "from-pink-500 to-rose-500",
    href: "/dashboard/tools/image-creator",
    category: "Visual"
  },
  {
    title: "Faceless Video Script",
    description: "Generate viral video scripts with scenes",
    icon: <Film size={20} />,
    gradient: "from-violet-500 to-purple-600",
    href: "/dashboard/tools/faceless-video",
    category: "Video"
  },
  {
    title: "Prompt Redesigner",
    description: "Enhance your AI prompts",
    icon: <WandSparkles size={20} />,
    gradient: "from-amber-500 to-orange-500",
    href: "/dashboard/tools/prompt-redesigner",
    category: "AI"
  },
  {
    title: "Text to Speech",
    description: "Convert text to natural speech",
    icon: <Volume2 size={20} />,
    gradient: "from-blue-500 to-cyan-500",
    href: "/dashboard/tools/text-to-speech",
    category: "Audio"
  },
  {
    title: "Text to Video",
    description: "Create videos from text descriptions",
    icon: <Clapperboard size={20} />,
    gradient: "from-red-500 to-pink-500",
    href: "/dashboard/tools/text-to-video",
    category: "Video"
  },
  {
    title: "Video to Text",
    description: "Transcribe videos to text",
    icon: <FileVideo size={20} />,
    gradient: "from-teal-500 to-cyan-500",
    href: "/dashboard/tools/video-to-text",
    category: "Video"
  }
];

const GridTools = () => {
  return (
    <section id="tools" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-foreground/80">AI-Powered Tools</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Complete
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              {" "}AI Toolkit
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create professional content. From video scripts to image generation, 
            our AI tools help you produce high-quality content faster than ever.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool, index) => (
            <Link href={tool.href} key={index}>
              <div className="group h-full p-5 rounded-xl bg-card border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${tool.gradient} text-white`}>
                    {tool.icon}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    {tool.category}
                  </span>
                </div>
                
                <h3 className="text-base font-semibold mb-1.5 group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {tool.description}
                </p>
                
                <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Try Now <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16">
          <div className="bg-card rounded-xl border border-border/50 p-8 text-center">
            <h3 className="text-xl font-bold mb-3">More Tools Coming Soon</h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              We're constantly adding new AI-powered tools to help you create better content. 
              Join our platform to get early access to new features.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                View All Tools
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GridTools;
