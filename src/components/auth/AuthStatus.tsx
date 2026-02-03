'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

/**
 * AuthStatus Component
 * Displays current authentication status and provides basic auth controls
 * Enhanced with session expiry information and monitoring
 */
export const AuthStatus: React.FC = () => {
  const { 
    user, 
    session, 
    loading, 
    signOut, 
    isAuthenticated, 
    isSessionExpired,
    timeUntilExpiry,
    sessionExpiry
  } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        <span>Loading auth...</span>
      </div>
    );
  }

  if (!isAuthenticated || isSessionExpired) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <div className="h-2 w-2 bg-red-500 rounded-full" />
        <span>{isSessionExpired ? 'Session expired' : 'Not authenticated'}</span>
      </div>
    );
  }

  // Format time until expiry
  const formatTimeUntilExpiry = () => {
    if (!timeUntilExpiry) return 'Unknown';
    
    const minutes = Math.floor(timeUntilExpiry / 60000);
    const seconds = Math.floor((timeUntilExpiry % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    
    return `${seconds}s`;
  };

  // Determine status color based on time remaining
  const getStatusColor = () => {
    if (!timeUntilExpiry) return 'bg-gray-500';
    
    if (timeUntilExpiry <= 300000) { // 5 minutes
      return 'bg-red-500';
    } else if (timeUntilExpiry <= 900000) { // 15 minutes
      return 'bg-yellow-500';
    }
    
    return 'bg-green-500';
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 text-sm">
        <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
        <span className="text-muted-foreground">
          {user?.user_metadata?.full_name || user?.email || 'User'}
        </span>
        {timeUntilExpiry && timeUntilExpiry <= 900000 && (
          <span className="text-xs text-yellow-600 dark:text-yellow-400">
            (expires in {formatTimeUntilExpiry()})
          </span>
        )}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={signOut}
        className="text-xs"
      >
        Sign Out
      </Button>
    </div>
  );
};

export default AuthStatus;