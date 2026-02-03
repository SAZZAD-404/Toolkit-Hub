'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface SessionMonitorProps {
  warningThreshold?: number; // milliseconds before expiry to show warning (default: 5 minutes)
  autoRefresh?: boolean; // automatically refresh when close to expiry
  className?: string;
}

/**
 * SessionMonitor Component
 * Monitors session expiry and provides warnings/refresh options
 * Implements session expiration handling as per requirements 1.2, 1.3
 */
export const SessionMonitor: React.FC<SessionMonitorProps> = ({
  warningThreshold = 300000, // 5 minutes
  autoRefresh = false,
  className = ''
}) => {
  const { 
    timeUntilExpiry, 
    isSessionExpired, 
    refreshSession, 
    signOut,
    isAuthenticated 
  } = useAuth();
  
  const [showWarning, setShowWarning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Monitor session expiry
  useEffect(() => {
    if (!isAuthenticated || !timeUntilExpiry) {
      setShowWarning(false);
      return;
    }

    const shouldShowWarning = timeUntilExpiry <= warningThreshold;
    setShowWarning(shouldShowWarning);

    // Auto-refresh if enabled and close to expiry (but not too close)
    if (autoRefresh && shouldShowWarning && timeUntilExpiry > 60000) { // More than 1 minute left
      handleRefresh();
    }
  }, [timeUntilExpiry, warningThreshold, autoRefresh, isAuthenticated]);

  // Handle session refresh
  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await refreshSession();
    } catch (error) {
      console.error('Failed to refresh session:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle session expired
  const handleExpired = async () => {
    await signOut();
  };

  // Format time remaining
  const formatTimeRemaining = () => {
    if (!timeUntilExpiry) return '';
    
    const minutes = Math.floor(timeUntilExpiry / 60000);
    const seconds = Math.floor((timeUntilExpiry % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Session expired
  if (isSessionExpired) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Session Expired
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              Your session has expired. Please sign in again.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExpired}
            className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Session warning
  if (showWarning) {
    return (
      <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Session Expiring Soon
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Your session will expire in {formatTimeRemaining()}. Refresh to continue.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/30"
          >
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh Session'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default SessionMonitor;