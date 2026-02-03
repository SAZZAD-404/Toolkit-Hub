'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  onUnauthorized?: () => void;
  onSessionExpired?: () => void;
}

interface AuthGuardState {
  isAuthorized: boolean;
  isLoading: boolean;
  shouldRedirect: boolean;
}

/**
 * Authentication guard hook
 * Provides authentication state checking and automatic redirects
 * Implements session expiration and cleanup as per requirements 1.2, 1.3, 1.5
 */
export const useAuthGuard = (options: UseAuthGuardOptions = {}): AuthGuardState => {
  const {
    redirectTo = '/login',
    requireAuth = true,
    onUnauthorized,
    onSessionExpired
  } = options;

  const { isAuthenticated, loading, isSessionExpired, user } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    const isAuthorized = !requireAuth || (isAuthenticated && !isSessionExpired);

    if (!isAuthorized) {
      setShouldRedirect(true);

      // Call appropriate callback
      if (isSessionExpired && onSessionExpired) {
        onSessionExpired();
      } else if (!isAuthenticated && onUnauthorized) {
        onUnauthorized();
      }

      // Redirect to login with current path
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = `${redirectTo}?next=${encodeURIComponent(currentPath)}`;
      
      // Small delay to allow callbacks to execute
      setTimeout(() => {
        router.replace(loginUrl);
      }, 100);
    } else {
      setShouldRedirect(false);
    }
  }, [
    isAuthenticated,
    isSessionExpired,
    loading,
    requireAuth,
    redirectTo,
    router,
    onUnauthorized,
    onSessionExpired
  ]);

  return {
    isAuthorized: !requireAuth || (isAuthenticated && !isSessionExpired),
    isLoading: loading,
    shouldRedirect
  };
};

/**
 * Hook for checking specific user permissions
 */
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();

  const hasRole = (role: string): boolean => {
    if (!isAuthenticated || !user) return false;
    return (user.user_metadata as any)?.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    if (!isAuthenticated || !user) return false;
    const permissions = (user.user_metadata as any)?.permissions || [];
    return permissions.includes(permission);
  };

  const isAdmin = (): boolean => {
    return hasRole('admin') || hasRole('super_admin');
  };

  const canAccess = (requiredRoles: string[] = [], requiredPermissions: string[] = []): boolean => {
    if (!isAuthenticated || !user) return false;

    // Check roles
    if (requiredRoles.length > 0) {
      const userRole = (user.user_metadata as any)?.role;
      if (!userRole || !requiredRoles.includes(userRole)) {
        return false;
      }
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
      const userPermissions = (user.user_metadata as any)?.permissions || [];
      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );
      if (!hasAllPermissions) {
        return false;
      }
    }

    return true;
  };

  return {
    hasRole,
    hasPermission,
    isAdmin,
    canAccess,
    userRole: (user?.user_metadata as any)?.role,
    userPermissions: (user?.user_metadata as any)?.permissions || []
  };
};

export default useAuthGuard;