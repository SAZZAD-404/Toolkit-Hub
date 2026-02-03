"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Logo from "@/components/ui/Logo";
import AuthStatus from "@/components/auth/AuthStatus";
import { useAuth } from "@/contexts/AuthContext";
import { useHeaderOptimization, useHeaderTheme } from "@/hooks/useHeaderOptimization";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  variant?: 'default' | 'minimal' | 'dashboard';
  className?: string;
}

const Header = React.memo(({ variant = 'default', className = '' }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  
  const { navigationState, isScrolled, handleScroll } = useHeaderOptimization();
  const { mounted } = useHeaderTheme();

  const optimizedHandleScroll = useCallback(() => {
    handleScroll();
  }, [handleScroll]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (variant === 'default') {
      window.addEventListener("scroll", optimizedHandleScroll, { passive: true });
      return () => window.removeEventListener("scroll", optimizedHandleScroll);
    }
  }, [variant, optimizedHandleScroll]);

  const navigationItems = useMemo(() => [
    { href: "#features", label: "Features" },
    { href: "#tools", label: "Tools" },
    { href: "#pricing", label: "Pricing" }
  ], []);

  const headerStyles = useMemo(() => {
    const baseClasses = "fixed top-0 z-50 w-full transition-all duration-300";
    const navigationClasses = navigationState === 'navigating' ? 'opacity-95' : 'opacity-100';
    
    switch (variant) {
      case 'minimal':
        return `${baseClasses} bg-background/80 backdrop-blur-xl border-b border-border py-3 ${navigationClasses}`;
      case 'dashboard':
        return `${baseClasses} bg-background/95 backdrop-blur-xl border-b border-border py-3 ${navigationClasses}`;
      default:
        return `${baseClasses} ${
          mounted && isScrolled ? "bg-background/80 backdrop-blur-xl border-b border-border py-3" : "bg-transparent py-5"
        } ${navigationClasses}`;
    }
  }, [variant, mounted, isScrolled, navigationState]);

  const authSection = useMemo(() => {
    if (!mounted || loading) {
      return (
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      );
    }

    if (isAuthenticated) {
      return <AuthStatus />;
    }

    return (
      <>
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Login
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button size="sm">
            Get Started
          </Button>
        </Link>
      </>
    );
  }, [mounted, loading, isAuthenticated]);

  const showNavigation = variant !== 'dashboard';

  return (
    <header className={`${headerStyles} ${className}`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link className="flex items-center gap-2.5 group cursor-pointer" href="/">
          <Logo className="scale-75" />
        </Link>

        {showNavigation && (
          <nav className="hidden items-center gap-1 md:flex">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-lg hover:bg-accent/50"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        <div className="hidden md:flex items-center gap-3">
          {authSection}
        </div>

        <div className="md:hidden flex items-center gap-2">
          {showNavigation && (
            <button
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {showNavigation && mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-background/95 backdrop-blur-xl border-b border-border p-6 md:hidden">
          <nav className="flex flex-col gap-4">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                className="text-lg font-medium text-muted-foreground hover:text-foreground py-2 border-b border-border/50"
                href={item.href}
                onClick={toggleMobileMenu}
              >
                {item.label}
              </a>
            ))}
            
            <div className="mt-4 pt-4 border-t border-border">
              {mounted && !loading && (
                <>
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <AuthStatus />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Link href="/login" className="w-full" onClick={toggleMobileMenu}>
                        <Button variant="outline" className="w-full">
                          Login
                        </Button>
                      </Link>
                      <Link href="/dashboard" className="w-full" onClick={toggleMobileMenu}>
                        <Button className="w-full">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
              {(!mounted || loading) && (
                <div className="flex items-center justify-center space-x-2 py-4">
                  <div className="animate-spin h-4 w-4 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
