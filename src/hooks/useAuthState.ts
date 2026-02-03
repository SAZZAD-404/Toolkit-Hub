'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Enhanced authentication hook with additional utilities
 * Provides convenient methods for authentication state management
 */
export const useAuthState = () => {
  const auth = useAuth();
  const router = useRouter();

  // Redirect to login with current path as next parameter
  const redirectToLogin = useCallback((currentPath?: string) => {
    const next = encodeURIComponent(currentPath || window.location.pathname);
    router.push(`/login?next=${next}`);
  }, [router]);

  // Redirect to dashboard or specified path after successful authentication
  const redirectAfterAuth = useCallback((defaultPath = '/dashboard') => {
    const urlParams = new URLSearchParams(window.location.search);
    const next = urlParams.get('next');
    const redirectPath = next ? decodeURIComponent(next) : defaultPath;
    router.push(redirectPath);
  }, [router]);

  // Check if user has specific role or permission
  const hasRole = useCallback((role: string) => {
    return (auth.user?.user_metadata as any)?.role === role;
  }, [auth.user]);

  // Get user display name
  const getDisplayName = useCallback(() => {
    if (!auth.user) return null;
    return auth.user.user_metadata?.full_name || auth.user.email || 'User';
  }, [auth.user]);

  // Get user avatar URL
  const getAvatarUrl = useCallback(() => {
    return auth.user?.user_metadata?.avatar_url || null;
  }, [auth.user]);

  // Enhanced sign out with redirect
  const signOutAndRedirect = useCallback(async (redirectPath = '/') => {
    await auth.signOut();
    router.push(redirectPath);
  }, [auth, router]);

  // Check if session is about to expire (within 5 minutes)
  const isSessionExpiringSoon = useCallback(() => {
    if (!auth.timeUntilExpiry) return false;
    return auth.timeUntilExpiry <= 300000; // 5 minutes in milliseconds
  }, [auth.timeUntilExpiry]);

  // Get formatted time until expiry
  const getFormattedTimeUntilExpiry = useCallback(() => {
    if (!auth.timeUntilExpiry) return null;
    
    const minutes = Math.floor(auth.timeUntilExpiry / 60000);
    const seconds = Math.floor((auth.timeUntilExpiry % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [auth.timeUntilExpiry]);

  // Force session refresh
  const forceRefresh = useCallback(async () => {
    try {
      await auth.refreshSession();
      return true;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
  }, [auth]);

  return {
    ...auth,
    redirectToLogin,
    redirectAfterAuth,
    hasRole,
    getDisplayName,
    getAvatarUrl,
    signOutAndRedirect,
    isSessionExpiringSoon,
    getFormattedTimeUntilExpiry,
    forceRefresh,
  };
};

export default useAuthState;