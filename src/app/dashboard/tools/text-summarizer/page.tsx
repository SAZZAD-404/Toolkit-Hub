'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FileText, Copy, Check, RotateCcw, Sparkles } from 'lucide-react';
import useAiGeneration from '@/hooks/useAiGeneration';
import ErrorDisplay from '@/components/ui/error-display';
import FailoverStatus from '@/components/ui/failover-status';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import ToolPageHeader from '@/components/tools/ToolPageHeader';
import { Button } from '@/components/ui/button';

export default function TextSummarizerPage() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    loading,
    error,
    failoverStatus,
    attempts,
    generateWithAi,
    reset
  } = useAiGeneration({
    onSuccess: (result) => {
      setSummary(result.summary);
    }
  });

  const summarize = async () => {
    if (!text.trim()) return;

    reset();
    setSummary('');
    
    await generateWithAi(async () => {
      let token: string | undefined;
      if (isSupabaseConfigured) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, length }),
      });

      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from server');
      }
      
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        throw new Error('Server error - please try again');
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Response:', responseText.slice(0, 200));
        throw new Error('Invalid response from server - please try again');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to summarize text');
      }

      return data;
    }, 'Text Summarization');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    document.title = 'Text Summarizer - ToolkitHub';
  }, []);

  return (
    <div className="space-y-6">
      <ToolPageHeader
        icon={FileText}
        title="Text Summarizer"
        description="AI-powered text summarization"
        iconBg="bg-gradient-to-br from-violet-500 to-purple-600"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Original Text</h3>
            <span className="text-xs text-muted-foreground">{text.length} characters</span>
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 p-4 rounded-xl bg-muted/50 border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground"
            placeholder="Paste your text here to summarize..."
          />
          
          <div className="mt-5">
            <label className="block text-sm font-medium text-foreground mb-3">Summary Length</label>
            <div className="flex gap-2">
              {(['short', 'medium', 'long'] as const).map((len) => (
                <button
                  key={len}
                  onClick={() => setLength(len)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 ${
                    length === len 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border'
                  }`}
                >
                  {len.charAt(0).toUpperCase() + len.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4">
              <ErrorDisplay 
                error={error}
                failoverStatus={failoverStatus}
                attempts={attempts}
                onRetry={summarize}
                loading={loading}
              />
            </div>
          )}

          {(loading || failoverStatus) && (
            <div className="mt-4">
              <FailoverStatus 
                status={failoverStatus}
                attempts={attempts}
                loading={loading}
              />
            </div>
          )}

          <Button
            onClick={summarize}
            disabled={!text.trim() || loading}
            className="w-full mt-5"
            size="lg"
          >
            {loading ? (
              <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Summarizing...' : 'Summarize Text'}
          </Button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Summary</h3>
            {summary && (
              <Button
                variant={copied ? "default" : "outline"}
                size="sm"
                onClick={copyToClipboard}
                className={copied ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="h-64 bg-muted/50 border border-border rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">AI is summarizing your text...</p>
              </div>
            </div>
          ) : summary ? (
            <div className="h-64 p-4 bg-muted/50 border border-border rounded-xl overflow-y-auto">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{summary}</p>
            </div>
          ) : (
            <div className="h-64 bg-muted/50 border border-border rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Your summary will appear here</p>
              </div>
            </div>
          )}

          {summary && text && (
            <div className="mt-4 flex justify-between text-xs text-muted-foreground">
              <span>Original: {text.length} chars</span>
              <span>Summary: {summary.length} chars</span>
              <span className="text-emerald-500 font-medium">
                Reduced by {Math.round((1 - summary.length / text.length) * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
