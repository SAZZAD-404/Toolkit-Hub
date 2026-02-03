'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Film } from 'lucide-react';
import ToolPageHeader from '@/components/tools/ToolPageHeader';

interface NicheCardProps {
  id: string;
  name: string;
  icon: string;
  description: string;
  tags: string[];
}

const niches: NicheCardProps[] = [
  {
    id: 'historical-facts',
    name: 'Historical Mystery',
    icon: '🕵️',
    description: 'Cinematic mystery and suspense storytelling for history content.',
    tags: ['History', 'Mystery', 'Secrets'],
  },
  {
    id: 'car-restoration',
    name: 'Car Restoration',
    icon: '🚗',
    description: 'Professional restoration story scripts with perfect continuity.',
    tags: ['Automotive', 'Restoration', 'Workshop'],
  },
  {
    id: 'monkey-village-cooking',
    name: 'Monkey Village Cooking',
    icon: '🐒',
    description: 'Photorealistic monkey cooking in jungle environments.',
    tags: ['Nature', 'Cooking', 'ASMR'],
  },
  {
    id: 'animal-village-cooking',
    name: 'Animal Village Cooking',
    icon: '🦊',
    description: 'Ultra-realistic animal village cooking with cozy vibes.',
    tags: ['Animation', 'Cooking', 'Fantasy'],
  },
  {
    id: 'animal-rescue',
    name: 'Animal Rescue',
    icon: '🛟',
    description: 'Cinematic rescue micro-films with emotional storytelling.',
    tags: ['Rescue', 'Animals', 'Cinematic'],
  },
];

const NicheCard = ({ niche }: { niche: NicheCardProps }) => {
  return (
    <Link
      href={`/dashboard/tools/faceless-video/generate?niche=${niche.id}`}
      className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-4xl">{niche.icon}</span>
        <div className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            Start <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {niche.name}
      </h3>
      
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {niche.description}
      </p>
      
      <div className="flex flex-wrap gap-2">
        {niche.tags.map((tag) => (
          <span 
            key={tag} 
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground bg-muted/50 border border-border"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
};

export default function FacelessVideoNichePage() {
  useEffect(() => {
    document.title = 'Faceless Video - ToolkitHub';
  }, []);

  return (
    <div className="space-y-8">
      <ToolPageHeader
        icon={Film}
        title="Faceless Video Scripts"
        description="AI-powered video script generator for various niches"
        iconBg="bg-gradient-to-br from-orange-500 to-red-600"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {niches.map((niche) => (
          <NicheCard key={niche.id} niche={niche} />
        ))}
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-muted/50 border border-border">
          <Film className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">More niches coming soon</p>
        </div>
      </div>
    </div>
  );
}
