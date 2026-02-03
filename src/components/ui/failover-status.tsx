import React from 'react';
import { Loader2, CheckCircle, XCircle, Clock, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FailoverStatusProps {
  status: string | null;
  currentProvider?: string | null;
  attempts?: number;
  loading?: boolean;
  className?: string;
}

const providerInfo: Record<string, { name: string; emoji: string; color: string }> = {
  cerebras: { name: 'Cerebras', emoji: '🧠', color: 'text-purple-400' },
  xai: { name: 'XAI (Grok)', emoji: '🚀', color: 'text-blue-400' },
  deepseek: { name: 'DeepSeek', emoji: '🔍', color: 'text-green-400' },
  github: { name: 'GitHub Models', emoji: '🐙', color: 'text-gray-400' },
  gemini: { name: 'Gemini', emoji: '💎', color: 'text-cyan-400' },
  groq: { name: 'Groq', emoji: '⚡', color: 'text-yellow-400' },
  openai: { name: 'OpenAI', emoji: '🤖', color: 'text-emerald-400' },
  openrouter: { name: 'OpenRouter', emoji: '🛣️', color: 'text-orange-400' },
  deapi: { name: 'DEAPI', emoji: '🎯', color: 'text-pink-400' }
};

export const FailoverStatus: React.FC<FailoverStatusProps> = ({
  status,
  currentProvider,
  attempts = 0,
  loading = false,
  className = ''
}) => {
  // Hide on idle
  if (!status && !loading) return null;

  // UX: don't show a persistent "Successfully completed" banner
  if (!loading && status && /successfully completed!?/i.test(status.trim())) return null;

  const provider = currentProvider ? providerInfo[currentProvider] : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {loading ? (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            ) : status?.toLowerCase().includes('success') ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : status?.includes('error') ? (
              <XCircle className="w-4 h-4 text-red-400" />
            ) : (
              <Clock className="w-4 h-4 text-amber-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {provider && (
                <span className={`text-sm font-medium ${provider.color}`}>
                  {provider.emoji} {provider.name}
                </span>
              )}
              {attempts > 0 && (
                <span className="text-xs text-zinc-500 bg-white/[0.05] px-2 py-0.5 rounded-full">
                  {attempts} attempts
                </span>
              )}
            </div>
            
            <p className="text-sm text-zinc-300">
              {status || 'Processing...'}
            </p>
          </div>
        </div>
        
        {loading && (
          <div className="mt-2 w-full bg-white/[0.05] rounded-full h-1 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default FailoverStatus;