'use client';

import React, { useState, useRef } from 'react';
import { Upload, Copy, Check, Video, RotateCcw, FileText, X, Mic, Youtube, Link2, ArrowRight } from 'lucide-react';
import useAiGeneration from '@/hooks/useAiGeneration';
import ErrorDisplay from '@/components/ui/error-display';
import FailoverStatus from '@/components/ui/failover-status';

type TabType = 'upload' | 'youtube';

export default function VideoToTextPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    loading: fileLoading,
    error: fileError,
    failoverStatus: fileFailoverStatus,
    attempts: fileAttempts,
    generateWithAi: generateFileTranscript,
    reset: resetFile
  } = useAiGeneration({
    onSuccess: (result) => {
      setTranscript(result.text || '');
    }
  });

  const {
    loading: youtubeLoading,
    error: youtubeError,
    failoverStatus: youtubeFailoverStatus,
    attempts: youtubeAttempts,
    generateWithAi: generateYoutubeTranscript,
    reset: resetYoutube
  } = useAiGeneration({
    onSuccess: (result) => {
      setTranscript(result.text || '');
    }
  });

  const processing = fileLoading || youtubeLoading;
  const error = fileError || youtubeError;
  const failoverStatus = fileFailoverStatus || youtubeFailoverStatus;
  const attempts = fileAttempts || youtubeAttempts;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTranscript('');
      resetFile();
      resetYoutube();
    }
  };

  const transcribeFile = async () => {
    if (!file) return;

    resetFile();
    resetYoutube();
    setTranscript('');
    
    await generateFileTranscript(async () => {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('include_timestamps', 'false');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
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
        // Enhanced error handling for the new API response format
        const error = new Error(data.error || 'Failed to transcribe video');
        if (data.details) {
          (error as any).details = data.details;
        }
        throw error;
      }

      return data;
    }, 'Video Transcription');
  };

  const transcribeYoutube = async () => {
    if (!youtubeUrl.trim()) return;

    resetFile();
    resetYoutube();
    setTranscript('');
    
    await generateYoutubeTranscript(async () => {
      const response = await fetch('/api/transcribe/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl }),
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
        // Enhanced error handling for the new API response format
        const error = new Error(data.error || 'Failed to transcribe YouTube video');
        if (data.details) {
          (error as any).details = data.details;
        }
        throw error;
      }

      return data;
    }, 'YouTube Transcription');
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetState = () => {
    setFile(null);
    setYoutubeUrl('');
    setTranscript('');
    resetFile();
    resetYoutube();
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="tool-header-icon bg-gradient-to-br from-indigo-500 to-purple-500 shadow-indigo-500/25">
            <Mic size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Video to Text</h1>
            <p className="text-zinc-400">Transcribe video/audio or YouTube videos using WhisperLargeV3</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl mb-6">
            <button
              onClick={() => { setActiveTab('upload'); resetState(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'upload' 
                  ? 'bg-white/[0.08] text-white' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Upload size={16} /> Upload File
            </button>
            <button
              onClick={() => { setActiveTab('youtube'); resetState(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'youtube' 
                  ? 'bg-white/[0.08] text-white' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Youtube size={16} /> YouTube URL
            </button>
          </div>

          {activeTab === 'upload' ? (
            <>
              <h3 className="font-semibold text-white mb-4">Upload Video/Audio</h3>
              {!file ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="upload-zone rounded-xl p-12 text-center"
                >
                  <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Video size={28} className="text-indigo-400" />
                  </div>
                  <p className="text-white font-medium">Click to upload video or audio</p>
                  <p className="text-sm text-zinc-500 mt-1">MP4, MOV, MP3, WAV, M4A up to 100MB</p>
                </div>
              ) : (
                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Video size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{file.name}</p>
                      <p className="text-sm text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button 
                      onClick={() => { setFile(null); setTranscript(''); resetFile(); resetYoutube(); }}
                      className="p-2 rounded-lg hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              )}
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="video/*,audio/*,.mp4,.avi,.mov,.mkv,.webm,.flv,.m4v,.mp3,.wav,.m4a" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <button
                onClick={transcribeFile}
                disabled={!file || processing}
                className="w-full mt-5 flex items-center justify-center gap-2 py-3.5 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)' }}
              >
                {processing ? <RotateCcw size={18} className="animate-spin" /> : <FileText size={18} />}
                {processing ? 'Transcribing...' : 'Extract Transcript'}
              </button>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-white mb-4">YouTube Video URL</h3>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Link2 size={18} />
                </div>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl input-field text-sm"
                />
              </div>
              
              <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-1">
                  <Youtube size={16} />
                  YouTube to Script
                </div>
                <p className="text-xs text-red-400/70">
                  Paste any YouTube video URL to extract its full transcript/script using WhisperLargeV3.
                </p>
              </div>

              <button
                onClick={transcribeYoutube}
                disabled={!youtubeUrl.trim() || processing}
                className="w-full mt-5 flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed text-white"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}
              >
                {processing ? <RotateCcw size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                {processing ? 'Extracting Script...' : 'Get Video Script'}
              </button>
            </>
          )}



          {/* Enhanced Error Display */}
          {error && (
            <div className="mt-4">
              <ErrorDisplay 
                error={error}
                failoverStatus={failoverStatus}
                attempts={attempts}
                onRetry={activeTab === 'upload' ? transcribeFile : transcribeYoutube}
                loading={processing}
              />
            </div>
          )}

          {/* Failover Status Display */}
          {(processing || failoverStatus) && (
            <div className="mt-4">
              <FailoverStatus 
                status={failoverStatus}
                attempts={attempts}
                loading={processing}
              />
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white">
              {activeTab === 'youtube' ? 'Video Script' : 'Transcript'}
            </h3>
            {transcript && (
              <button 
                onClick={copyTranscript} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  copied 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'btn-secondary'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          {processing ? (
            <div className="flex items-center justify-center h-[300px] bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-14 h-14 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                </div>
                <p className="text-zinc-300">
                  {activeTab === 'youtube' 
                    ? 'Downloading video and extracting script...' 
                    : 'WhisperLargeV3 is transcribing your audio...'
                  }
                </p>
                <p className="text-xs text-zinc-500 mt-1">This may take a minute for longer files</p>
              </div>
            </div>
          ) : transcript ? (
            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl h-[300px] overflow-y-auto scrollbar-thin">
              <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{transcript}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                  <FileText size={28} className="text-zinc-600" />
                </div>
                <p className="text-zinc-500">
                  {activeTab === 'youtube' ? 'Video script will appear here' : 'Transcript will appear here'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}