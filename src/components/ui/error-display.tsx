import React from 'react';
import { AlertTriangle, RefreshCw, Zap, Clock, Shield, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ErrorDisplayProps {
  error: string | null;
  failoverStatus?: string | null;
  attempts?: number;
  onRetry?: () => void;
  loading?: boolean;
  className?: string;
}

const getErrorIcon = (error: string) => {
  if (error.includes('Rate limit') || error.includes('Rate limit exceeded')) {
    return <Clock className="w-5 h-5 text-amber-400" />;
  }
  if (error.includes('API key') || error.includes('key')) {
    return <Shield className="w-5 h-5 text-red-400" />;
  }
  if (error.includes('network') || error.includes('Internet connection')) {
    return <Wifi className="w-5 h-5 text-blue-400" />;
  }
  if (error.includes('quota') || error.includes('quota')) {
    return <Zap className="w-5 h-5 text-purple-400" />;
  }
  return <AlertTriangle className="w-5 h-5 text-red-400" />;
};

const getErrorColor = (error: string) => {
  if (error.includes('Rate limit') || error.includes('Rate limit exceeded')) {
    return 'border-amber-500/20 bg-amber-500/5';
  }
  if (error.includes('API key') || error.includes('key')) {
    return 'border-red-500/20 bg-red-500/5';
  }
  if (error.includes('network') || error.includes('Internet connection')) {
    return 'border-blue-500/20 bg-blue-500/5';
  }
  if (error.includes('quota') || error.includes('quota')) {
    return 'border-purple-500/20 bg-purple-500/5';
  }
  return 'border-red-500/20 bg-red-500/5';
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  failoverStatus,
  attempts = 0,
  onRetry,
  loading = false,
  className = ''
}) => {
  if (!error) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`rounded-xl border p-4 ${getErrorColor(error)} ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getErrorIcon(error)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white mb-1">
              Generation Failed
            </h4>
            
            <p className="text-sm text-zinc-300 mb-2">
              {error}
            </p>
            
            {failoverStatus && (
              <div className="text-xs text-zinc-500 mb-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3 h-3" />
                  <span className="font-medium">Failover Status:</span>
                </div>
                <p>{failoverStatus}</p>
                {attempts > 0 && (
                  <p className="mt-1">Total attempts: {attempts}</p>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.1] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Retrying...' : 'try again'}
                </button>
              )}
              
              <div className="text-xs text-zinc-500">
                {error.includes('Rate limit') && '⏰ Try again in a few minutes'}
                {error.includes('API key') && '🔑 Contact administrator'}
                {error.includes('network') && '🌐 Check your internet connection'}
                {error.includes('quota') && '💎 Contact administrator'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ErrorDisplay;