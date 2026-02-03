'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  ChefHat, 
  Rabbit, 
  Scroll,
  Sparkles,
  Clock,
  Users,
  Zap
} from 'lucide-react';

interface Niche {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  features: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
}

const niches: Niche[] = [
  {
    id: 'car-restoration',
    name: 'Car Restoration',
    description: 'Professional automotive restoration documentaries with logical progression',
    icon: <Car className="w-6 h-6" />,
    gradient: 'from-blue-500 to-cyan-500',
    features: [
      'Discovery → Transport → Inspection',
      'Cleaning → Preparation → Repair',
      'Assembly → Cinematic Reveal',
      'Car Identity Anchor System'
    ],
    difficulty: 'Advanced',
    estimatedTime: '15-20 min'
  },
  {
    id: 'monkey-cooking',
    name: 'Monkey Village Cooking',
    description: 'Multi-character coordination in jungle bamboo kitchen with ASMR focus',
    icon: <ChefHat className="w-6 h-6" />,
    gradient: 'from-green-500 to-emerald-500',
    features: [
      'Multiple Monkey Characters',
      'Physical Coordination',
      'High-fidelity ASMR',
      'Jungle Bamboo Kitchen'
    ],
    difficulty: 'Intermediate',
    estimatedTime: '10-15 min'
  },
  {
    id: 'animal-cooking',
    name: 'Animal Village Cooking',
    description: 'Wholesome magical storytelling with stylized animal characters',
    icon: <Rabbit className="w-6 h-6" />,
    gradient: 'from-pink-500 to-rose-500',
    features: [
      'Wholesome Storytelling',
      'Magical Atmosphere',
      'Cozy Clothing & Accessories',
      'Multi-Animal Coordination'
    ],
    difficulty: 'Beginner',
    estimatedTime: '8-12 min'
  },
  {
    id: 'historical-mystery',
    name: 'Historical Mystery',
    description: 'Suspense mode with Chiaroscuro lighting and emotional depth',
    icon: <Scroll className="w-6 h-6" />,
    gradient: 'from-purple-500 to-indigo-500',
    features: [
      'Chiaroscuro Lighting',
      'Dutch Angles & Macro Zooms',
      'Psychological Micro-expressions',
      'Haunting Audio Score'
    ],
    difficulty: 'Advanced',
    estimatedTime: '12-18 min'
  },
  {
    id: 'animal-rescue',
    name: 'Animal Rescue',
    description: 'Visual-only rescue micro-films with high empathy and proof-of-safety endings',
    icon: <Sparkles className="w-6 h-6" />,
    gradient: 'from-sky-500 to-violet-500',
    features: [
      'Visual-only (no dialogue/text)',
      'Vulnerability → Rescue → Warm Closure',
      'Midpoint Reveal + False Setback',
      'Continuity Lock on markings'
    ],
    difficulty: 'Advanced',
    estimatedTime: '10-15 min'
  }
];

interface NicheSelectorProps {
  selectedNiche: string | null;
  onNicheSelect: (nicheId: string) => void;
}

const NicheSelector: React.FC<NicheSelectorProps> = ({ selectedNiche, onNicheSelect }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Niche</h2>
        <p className="text-muted-foreground">
          Select a specialized niche for optimized script generation with unique features
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {niches.map((niche) => (
          <Card 
            key={niche.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
              selectedNiche === niche.id 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => onNicheSelect(niche.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${niche.gradient} text-white`}>
                    {niche.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{niche.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getDifficultyColor(niche.difficulty)}>
                        {niche.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {niche.estimatedTime}
                      </div>
                    </div>
                  </div>
                </div>
                {selectedNiche === niche.id && (
                  <div className="text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {niche.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Zap className="w-3 h-3" />
                  Key Features:
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {niche.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <div className="w-1 h-1 bg-primary rounded-full" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedNiche && (
        <div className="text-center">
          <Button 
            onClick={() => onNicheSelect('')}
            variant="outline"
            size="sm"
          >
            Clear Selection
          </Button>
        </div>
      )}
    </div>
  );
};

export default NicheSelector;