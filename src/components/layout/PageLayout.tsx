'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/sections/header';

interface PageLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  headerVariant?: 'default' | 'minimal' | 'dashboard';
  className?: string;
}

/**
 * Shared page layout component that ensures header consistency across all pages
 * Implements requirements 6.1, 6.2, 6.3, 6.4, 6.5 for cross-page header behavior
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  showHeader = true,
  headerVariant,
  className = ''
}) => {
  const pathname = usePathname();

  // Determine header variant based on pathname if not explicitly provided
  const getHeaderVariant = (): 'default' | 'minimal' | 'dashboard' => {
    if (headerVariant) return headerVariant;
    
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/reset-password')) {
      return 'minimal';
    }
    return 'default';
  };

  const variant = getHeaderVariant();

  return (
    <div className={`min-h-screen ${className}`}>
      {showHeader && (
        <Header 
          variant={variant}
          className="header-consistent"
        />
      )}
      <main className={showHeader ? 'pt-16' : ''}>
        {children}
      </main>
    </div>
  );
};

export default PageLayout;