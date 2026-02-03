'use client';

import React, { useState } from 'react';
import { Wand2, Copy, Check, RotateCcw, Sparkles, Layers, Zap } from 'lucide-react';
import useAiGeneration from '@/hooks/useAiGeneration';
import ErrorDisplay from '@/components/ui/error-display';
import FailoverStatus from '@/components/ui/failover-status';

export default function PromptRedesignerPage() {
  const [prompt, setPrompt] = useState('');
  const [redesigned, setRedesigned] = useState('');
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<'professional' | 'creative' | 'detailed'>('professional');

  const {
    loading,
    error,
    failoverStatus,
    attempts,
    generateWithAi,
    reset
  } = useAiGeneration({
    onSuccess: (result) => {
      setRedesigned(result.enhanced);
    }
  });

  const redesignPrompt = async () => {
    if (!prompt.trim()) return;

    reset(); // Clear previous errors
    setRedesigned('');
    
    await generateWithAi(async () => {
      const response = await fetch('/api/redesign-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone }),
      });

      const text = await response.text();
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }
      
      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        throw new Error('Server error - please try again');
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Response:', text.slice(0, 200));
        throw new Error('Invalid response from server - please try again');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to redesign prompt');
      }

      return data;
    }, 'Prompt Redesign');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(redesigned);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="tool-header-icon bg-gradient-to-br from-amber-600 to-orange-900 shadow-amber-500/25">
          <Sparkles size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Neural Prompt Redesigner</h1>
          <p className="text-zinc-500 font-medium italic">Enhance raw concepts into cinematic neural instructions</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 min-h-[500px]">
        <div className="glass-card rounded-2xl p-6 flex flex-col h-full border-white/[0.03]">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Layers size={14} className="text-amber-500" /> Source Concept
          </h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full flex-1 min-h-[320px] p-5 rounded-xl input-field text-sm resize-none focus:border-amber-500/50 leading-relaxed"
            placeholder="A man in a dark room..."
          />
          
          <div className="mt-6">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3 block">Neural Style Projection</label>
            <div className="flex flex-wrap gap-2">
              {(['professional', 'creative', 'detailed'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    tone === t 
                      ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-lg shadow-amber-500/25' 
                      : 'bg-white/[0.02] text-zinc-500 hover:text-white hover:bg-white/[0.06] border border-white/[0.04]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Error Display */}
          {error && (
            <div className="mt-4">
              <ErrorDisplay 
                error={error}
                failoverStatus={failoverStatus}
                attempts={attempts}
                onRetry={redesignPrompt}
                loading={loading}
              />
            </div>
          )}

          {/* Failover Status Display */}
          {(loading || failoverStatus) && (
            <div className="mt-4">
              <FailoverStatus 
                status={failoverStatus}
                attempts={attempts}
                loading={loading}
              />
            </div>
          )}

          <button
            onClick={redesignPrompt}
            disabled={!prompt.trim() || loading}
            className="w-full mt-6 flex items-center justify-center gap-3 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-white transition-all active:scale-[0.98] disabled:opacity-50 bg-gradient-to-r from-amber-600 to-orange-800 shadow-xl shadow-amber-900/20"
          >
            {loading ? <RotateCcw size={18} className="animate-spin" /> : <Wand2 size={18} />}
            {loading ? 'Redesigning...' : 'Project Neural Prompt'}
          </button>
        </div>

        <div className="glass-card rounded-2xl p-6 flex flex-col h-full border-white/[0.03]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Zap size={14} className="text-amber-500" /> Refined Asset Instruction
            </h3>
            {redesigned && (
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  copied 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Captured' : 'Copy'}
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center flex-1 bg-white/[0.01] border border-white/[0.04] rounded-xl">
              <div className="text-center px-4">
                <div className="relative mb-4">
                  <div className="w-14 h-14 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin mx-auto" />
                  <Sparkles size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500/50" />
                </div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse">Neural Core Processing...</p>
                <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-2">Developing Cinematic Continuity</p>
              </div>
            </div>
          ) : redesigned ? (
            <div className="p-5 bg-amber-500/[0.01] border border-amber-500/[0.05] rounded-xl flex-1 overflow-y-auto custom-scrollbar italic leading-relaxed min-h-[320px]">
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{redesigned}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1 bg-white/[0.01] border border-white/[0.04] rounded-xl text-center">
              <div className="opacity-40">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.02] flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
                  <Wand2 size={28} className="text-zinc-600" />
                </div>
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Awaiting Concept Projection</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}