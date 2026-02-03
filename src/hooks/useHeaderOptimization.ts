'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Custom hook for optimizing header performance and navigation state
 * Implements requirements 6.4, 6.5 for header stability and performance
 */
export const useHeaderOptimization = () => {
  const [navigationState, setNavigationState] = useState<'idle' | 'navigating' | 'complete'>('idle');
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Optimized scroll handler with debouncing
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(prev => prev !== scrolled ? scrolled : prev);
    }, 10); // Small debounce to prevent excessive updates
  }, []);

  // Navigation state management
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      setNavigationState('navigating');
      
      // Mark navigation as complete after a short delay
      const timer = setTimeout(() => {
        setNavigationState('complete');
        setTimeout(() => setNavigationState('idle'), 100);
      }, 50);

      previousPathname.current = pathname;
      
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    navigationState,
    isScrolled,
    handleScroll,
    pathname
  };
};

/**
 * Hook for managing header visibility and transitions
 */
export const useHeaderVisibility = (variant: 'default' | 'minimal' | 'dashboard' = 'default') => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const currentScrollY = window.scrollY;
      
      // Only hide header for default variant on scroll down
      if (variant === 'default') {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        // Always visible for minimal and dashboard variants
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    }, 10);
  }, [lastScrollY, variant]);

  useEffect(() => {
    if (variant === 'default') {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [handleScroll, variant]);

  return { isVisible };
};

/**
 * Hook for managing header theme consistency
 */
export const useHeaderTheme = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return { mounted };
};