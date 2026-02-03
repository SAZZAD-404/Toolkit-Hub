'use client';

import React from 'react';
import { type LucideProps } from 'lucide-react';

interface ToolPageHeaderProps {
  icon: React.ComponentType<LucideProps>;
  title: string;
  description: string;
  iconBg?: string;
}

export default function ToolPageHeader({
  icon: Icon,
  title,
  description,
  iconBg = 'bg-primary',
}: ToolPageHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${iconBg}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}
