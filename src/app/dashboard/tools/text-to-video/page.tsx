'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Video, RotateCcw, Download, X, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function ImageToVideoPage() {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const pollStatus = useCallback(async (reqId: string) => {
    try {
      const response = await fetch(`/api/image-to-video/status?requestId=${reqId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status');
      }

      setStatus(data.status || 'processing');

      if (data.status === 'done' || data.status === 'completed' || data.status === 'success') {
        if (data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setGenerating(false);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } else if (data.status === 'error' || data.status === 'failed') {
        setError(data.error || 'Video generation failed');
        setGenerating(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (err: any) {
      console.error('Polling error:', err);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setVideoUrl(null);
        setError(null);
        setRequestId(null);
        setStatus('');
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVideo = async () => {
    if (!image) return;
    setGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatus('processing');

    try {
      let token: string | undefined;
      if (isSupabaseConfigured) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }

      const response = await fetch('/api/image-to-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ image, prompt }),
      });

        const text = await response.text();
        
        if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
          throw new Error('Server error - please try again');
        }
        
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Invalid response from server');
        }

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate video');
        }

      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setStatus('done');
        setGenerating(false);
      } else if (data.requestId) {
        setRequestId(data.requestId);
        pollingRef.current = setInterval(() => {
          pollStatus(data.requestId);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message);
      setGenerating(false);
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'initiating': return 'Initiating request...';
      case 'processing': return 'Processing video...';
      case 'queued': return 'In queue, please wait...';
      case 'done':
      case 'completed':
      case 'success': return 'Video ready!';
      default: return 'Generating video...';
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="tool-header-icon bg-gradient-to-br from-violet-500 to-purple-500 shadow-violet-500/25">
            <Video size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Text to Video</h1>
            <p className="text-zinc-400">Animate your static images into stunning videos with LTX-Video</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-5">Upload Source Image</h3>
            
            {!image ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="upload-zone rounded-xl p-12 text-center"
              >
                <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center text-violet-400 mx-auto mb-4">
                  <Upload size={32} />
                </div>
                <p className="text-white font-medium text-lg">Click to upload image</p>
                <p className="text-sm text-zinc-500 mt-1">Maximum file size: 10MB</p>
              </div>
            ) : (
              <div className="relative group rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.06] aspect-video">
                <img src={image} alt="Source" className="w-full h-full object-contain" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Animation Prompt (Optional)</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how you want the image to animate... (e.g., 'Gentle wind blowing through the trees', 'The water flowing smoothly')"
              className="w-full h-32 p-4 rounded-xl input-field text-sm resize-none"
            />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-5">Video Preview</h3>
          
          <div className="aspect-video bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden flex items-center justify-center relative">
            {generating ? (
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto" />
                  <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-400" />
                </div>
                <p className="font-medium text-white">{getStatusText()}</p>
                <p className="text-sm text-zinc-500 mt-1">This typically takes 20-60 seconds</p>
                {requestId && (
                  <p className="text-xs text-zinc-600 mt-2">Request ID: {requestId}</p>
                )}
              </div>
            ) : videoUrl ? (
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Video size={32} className="text-zinc-600" />
                </div>
                <p className="text-zinc-500">Your generated video will appear here after processing</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {videoUrl && !generating && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
              <CheckCircle size={18} className="shrink-0" />
              <p>Video generated successfully!</p>
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <button
              onClick={generateVideo}
              disabled={!image || generating}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? <RotateCcw size={20} className="animate-spin" /> : <Sparkles size={20} />}
              {generating ? 'Processing...' : 'Generate Video'}
            </button>
            
            {videoUrl && (
              <a 
                href={videoUrl} 
                download="animated-video.mp4"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 flex items-center justify-center rounded-xl font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
              >
                <Download size={20} className="text-white" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}