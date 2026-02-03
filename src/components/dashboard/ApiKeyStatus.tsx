'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Key,
  Activity
} from 'lucide-react';

interface ProviderStatus {
  provider: string;
  totalKeys: number;
  failedKeys: number;
  workingKeys: number;
  healthPercentage: number;
}

interface KeyStatusResponse {
  success: boolean;
  timestamp: string;
  providers: ProviderStatus[];
  totalProviders: number;
  healthyProviders: number;
}

const ApiKeyStatus = () => {
  const [status, setStatus] = useState<KeyStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKeyStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/key-status');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data);
      } else {
        setError(data.error || 'Failed to fetch key status');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeyStatus();
  }, []);

  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (percentage >= 50) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          API Key Status
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchKeyStatus}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">
            Error: {error}
          </div>
        )}

        {status && (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className="font-medium">Overall Health</span>
              </div>
              <Badge variant={status.healthyProviders === status.totalProviders ? 'default' : 'destructive'}>
                {status.healthyProviders}/{status.totalProviders} Providers Active
              </Badge>
            </div>

            {/* Provider Details */}
            <div className="space-y-3">
              {status.providers.map((provider) => (
                <div key={provider.provider} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getHealthIcon(provider.healthPercentage)}
                    <div>
                      <div className="font-medium capitalize">{provider.provider}</div>
                      <div className="text-sm text-muted-foreground">
                        {provider.workingKeys}/{provider.totalKeys} keys working
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bold ${getHealthColor(provider.healthPercentage)}`}>
                      {provider.healthPercentage}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {provider.failedKeys > 0 && `${provider.failedKeys} failed`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Last Updated */}
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Last updated: {new Date(status.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {loading && !status && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiKeyStatus;