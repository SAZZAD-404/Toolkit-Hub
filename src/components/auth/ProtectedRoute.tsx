'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * Higher-order component for protecting routes that require authentication
 * Implements authentication state consistency as per requirement 1.1, 1.3
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  requireAuth = true,
  fallback = null
}) => {
  const { isAuthenticated, loading, isSessionExpired } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (requireAuth && (!isAuthenticated || isSessionExpired)) {
      // Store current path for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = `${redirectTo}?next=${encodeURIComponent(currentPath)}`;
      router.replace(loginUrl);
    }
  }, [isAuthenticated, isSessionExpired, loading, requireAuth, redirectTo, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show fallback if not authenticated and fallback is provided
  if (requireAuth && (!isAuthenticated || isSessionExpired)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Return null while redirecting
    return null;
  }

  // Render children if authenticated or auth not required
  return <>{children}</>;
};

/**
 * Higher-order component version of ProtectedRoute
 * Usage: const ProtectedComponent = withAuth(MyComponent);
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ProtectedRoute;