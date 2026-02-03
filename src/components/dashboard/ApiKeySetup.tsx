'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Key,
  ExternalLink,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProviderValidation {
  provider: string;
  totalKeys: number;
  validFormatKeys: number;
  hasKeys: boolean;
  format: string;
  keyPreviews: string[];
}

interface ValidationResponse {
  success: boolean;
  timestamp: string;
  providers: ProviderValidation[];
  totalWorkingProviders: number;
  recommendations: string[];
  setupGuide: Record<string, string>;
}

const ApiKeySetup = () => {
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const fetchValidation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/validate-keys');
      const data = await response.json();
      
      if (data.success) {
        setValidation(data);
      } else {
        setError(data.error || 'Failed to validate keys');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidation();
  }, []);

  const getProviderStatus = (provider: ProviderValidation) => {
    if (!provider.hasKeys) return { color: 'text-red-500', icon: XCircle, status: 'No Keys' };
    if (provider.validFormatKeys === 1) return { color: 'text-yellow-500', icon: AlertTriangle, status: 'Single Key' };
    return { color: 'text-green-500', icon: CheckCircle, status: 'Multiple Keys' };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key Setup & Validation
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchValidation}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Validate
          </Button>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {validation && (
            <div className="space-y-6">
              {/* Overall Status */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <h3 className="font-semibold">Setup Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {validation.totalWorkingProviders} of {validation.providers.length} providers configured
                  </p>
                </div>
                <Badge variant={validation.totalWorkingProviders > 0 ? 'default' : 'destructive'}>
                  {validation.totalWorkingProviders > 0 ? 'Ready' : 'Setup Required'}
                </Badge>
              </div>

              {/* Recommendations */}
              {validation.recommendations.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {validation.recommendations.map((rec, index) => (
                        <div key={index}>{rec}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Provider Details */}
              <div className="space-y-4">
                <h4 className="font-semibold">Provider Configuration</h4>
                {validation.providers.map((provider) => {
                  const status = getProviderStatus(provider);
                  const StatusIcon = status.icon;
                  
                  return (
                    <div key={provider.provider} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`w-5 h-5 ${status.color}`} />
                          <div>
                            <h5 className="font-medium capitalize">{provider.provider}</h5>
                            <p className="text-sm text-muted-foreground">
                              {provider.validFormatKeys} valid keys configured
                            </p>
                          </div>
                        </div>
                        <Badge variant={provider.hasKeys ? 'default' : 'outline'}>
                          {status.status}
                        </Badge>
                      </div>

                      {/* Key Previews */}
                      {provider.keyPreviews.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Keys:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleKeyVisibility(provider.provider)}
                            >
                              {showKeys[provider.provider] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                          {provider.keyPreviews.map((preview, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm font-mono bg-muted/50 p-2 rounded">
                              <span className="flex-1">
                                {showKeys[provider.provider] ? preview : preview.replace(/./g, '*')}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(preview)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Setup Guide */}
                      {!provider.hasKeys && validation.setupGuide[provider.provider] && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800 mb-2">
                            <strong>Get API Key:</strong>
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-blue-100 px-2 py-1 rounded flex-1">
                              {validation.setupGuide[provider.provider]}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(validation.setupGuide[provider.provider].match(/https?:\/\/[^\s]+/)?.[0], '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Format Info */}
                      <div className="mt-3 text-xs text-muted-foreground">
                        Expected format: {provider.format}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Environment Setup Instructions */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-semibold mb-3">Environment Setup</h4>
                <div className="space-y-2 text-sm">
                  <p>Add your API keys to <code className="bg-muted px-1 rounded">.env.local</code>:</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`# Multiple keys per provider supported
GEMINI_API_KEY=your_gemini_key_1
GEMINI_API_KEY_1=your_gemini_key_2
GROQ_API_KEY=your_groq_key_1
GROQ_API_KEY_1=your_groq_key_2
OPENAI_API_KEY=your_openai_key_1`}
                  </pre>
                  <p className="text-muted-foreground">
                    Restart the development server after adding keys.
                  </p>
                </div>
              </div>

              {/* Test API */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Test Your Setup</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Use the mock API to test the system without valid keys:
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.open('/api/test-script', '_blank')}
                >
                  Test Mock API
                </Button>
              </div>
            </div>
          )}

          {loading && !validation && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeySetup;