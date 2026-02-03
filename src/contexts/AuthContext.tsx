'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { tokenManager, type SessionLike } from '@/lib/tokenManager';

// supabase-js types can vary by version; define the minimal shapes we need.
export type UserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
};

export type AuthResponseLike = {
  data: { user: UserLike | null; session: SessionLike | null };
  error: AuthError | null;
};

// Extended User interface as defined in design document
interface ExtendedUser extends UserLike {
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
}

// Auth context type as defined in design document
export interface AuthContextType {
  user: ExtendedUser | null;
  session: SessionLike | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponseLike>;
  signUp: (email: string, password: string) => Promise<AuthResponseLike>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
  sessionExpiry: number | null;
  isSessionExpired: boolean;
  timeUntilExpiry: number | null;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<SessionLike | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);

  // Computed properties for session state
  const isSessionExpired = useMemo(() => {
    if (!sessionExpiry) return false;
    return Date.now() >= sessionExpiry * 1000;
  }, [sessionExpiry]);

  const timeUntilExpiry = useMemo(() => {
    if (!sessionExpiry) return null;
    const remaining = (sessionExpiry * 1000) - Date.now();
    return Math.max(0, remaining);
  }, [sessionExpiry]);

  // Session cleanup function
  const cleanupSession = useCallback(() => {
    tokenManager.clearStoredSession();
    setUser(null);
    setSession(null);
    setSessionExpiry(null);
  }, []);

  // Enhanced session update function
  const updateSession = useCallback((newSession: SessionLike | null) => {
    if (newSession) {
      setSession(newSession);
      setUser(newSession.user as ExtendedUser);
      setSessionExpiry(newSession.expires_at || null);
      
      // Store session securely
      tokenManager.storeSession(newSession);
      tokenManager.resetRetryCount();
    } else {
      cleanupSession();
    }
  }, [cleanupSession]);

  // Automatic token refresh logic with enhanced error handling
  const refreshSession = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase?.auth) {
      return;
    }

    try {
      // Check if we should retry
      if (!tokenManager.shouldRetry()) {
        console.error('Max refresh attempts reached');
        cleanupSession();
        return;
      }

      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        await tokenManager.incrementRetryWithDelay();
        
        // If we've exhausted retries, clear tokens
        if (!tokenManager.shouldRetry()) {
          cleanupSession();
        }
        return;
      }

      if (data.session) {
        updateSession(data.session);
      }
    } catch (error) {
      console.error('Unexpected error during session refresh:', error);
      await tokenManager.incrementRetryWithDelay();
      
      if (!tokenManager.shouldRetry()) {
        cleanupSession();
      }
    }
  }, [cleanupSession, updateSession]);

  // Enhanced sign in function with better error handling
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResponseLike> => {
    if (!isSupabaseConfigured || !supabase?.auth) {
      return {
        data: { user: null, session: null },
        error: new AuthError('Supabase not configured') as any
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { data: { user: null, session: null }, error };
      }

      if (data.session && data.user) {
        updateSession(data.session);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        data: { user: null, session: null },
        error: new AuthError('Sign in failed') as any
      };
    }
  }, [updateSession]);

  // Enhanced sign up function with better error handling
  const signUp = useCallback(async (email: string, password: string): Promise<AuthResponseLike> => {
    if (!isSupabaseConfigured || !supabase?.auth) {
      return {
        data: { user: null, session: null },
        error: new AuthError('Supabase not configured') as any
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        return { data: { user: null, session: null }, error };
      }

      // Note: For sign up, session might be null if email confirmation is required
      if (data.session && data.user) {
        updateSession(data.session);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        data: { user: null, session: null },
        error: new AuthError('Sign up failed') as any
      };
    }
  }, [updateSession]);

  // Enhanced sign out function with complete cleanup
  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase?.auth) {
      cleanupSession();
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Always clear local state and tokens
      cleanupSession();
    }
  }, [cleanupSession]);

  // Initialize authentication state with enhanced session monitoring
  useEffect(() => {
    let mounted = true;
    let refreshTimer: NodeJS.Timeout | null = null;
    let sessionMonitor: NodeJS.Timeout | null = null;

    const scheduleRefresh = (expiresAt: number) => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      
      const refreshTime = (expiresAt * 1000) - Date.now() - 60000; // Refresh 1 minute before expiry
      
      if (refreshTime > 0) {
        refreshTimer = setTimeout(() => {
          if (mounted) {
            refreshSession();
          }
        }, refreshTime);
      }
    };

    const startSessionMonitoring = () => {
      if (sessionMonitor) {
        clearInterval(sessionMonitor);
      }
      
      // Check session validity every 30 seconds
      sessionMonitor = setInterval(() => {
        if (!mounted) return;
        
        const storedSession = tokenManager.getStoredSession();
        if (storedSession) {
          const validation = tokenManager.validateToken(storedSession);
          
          if (validation.isExpired) {
            console.log('Session expired, cleaning up');
            cleanupSession();
          } else if (validation.needsRefresh) {
            console.log('Session needs refresh');
            refreshSession();
          }
        }
      }, 30000); // Check every 30 seconds
    };

    const initializeAuth = async () => {
      if (!isSupabaseConfigured || !supabase?.auth) {
        setLoading(false);
        return;
      }

      try {
        // First, try to get the current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          cleanupSession();
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (session && mounted) {
          updateSession(session);
          scheduleRefresh(session.expires_at || 0);
          startSessionMonitoring();
        } else {
          // No active session, check stored tokens
          const storedSession = tokenManager.getStoredSession();
          if (storedSession) {
            const validation = tokenManager.validateToken(storedSession);
            if (validation.isValid && !validation.isExpired) {
              // Try to refresh with stored tokens
              await refreshSession();
              startSessionMonitoring();
            } else {
              // Clear expired tokens
              cleanupSession();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        cleanupSession();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener with enhanced handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        if (!mounted) return;

        console.log('Auth state change:', event, session?.user?.id);

        if (event === 'SIGNED_IN' && session) {
          updateSession(session);
          scheduleRefresh(session.expires_at || 0);
          startSessionMonitoring();
        } else if (event === 'SIGNED_OUT') {
          cleanupSession();
          if (refreshTimer) {
            clearTimeout(refreshTimer);
            refreshTimer = null;
          }
          if (sessionMonitor) {
            clearInterval(sessionMonitor);
            sessionMonitor = null;
          }
        } else if (event === 'TOKEN_REFRESHED' && session) {
          updateSession(session);
          scheduleRefresh(session.expires_at || 0);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      if (sessionMonitor) {
        clearInterval(sessionMonitor);
      }
    };
  }, [refreshSession, updateSession, cleanupSession]);

  // Computed property for authentication status
  const isAuthenticated = Boolean(user && session && !isSessionExpired);

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
    isAuthenticated,
    sessionExpiry,
    isSessionExpired,
    timeUntilExpiry
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;