'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Pause, Download, RotateCcw, Mic } from 'lucide-react';
import useAiGeneration from '@/hooks/useAiGeneration';
import ErrorDisplay from '@/components/ui/error-display';
import FailoverStatus from '@/components/ui/failover-status';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import ToolPageHeader from '@/components/tools/ToolPageHeader';
import { Button } from '@/components/ui/button';

const languages = [
  { id: 'en-gb', name: 'English (GB)' },
  { id: 'en-us', name: 'English (US)' },
  { id: 'es', name: 'Spanish' },
  { id: 'hi', name: 'Hindi' },
  { id: 'it', name: 'Italian' },
  { id: 'pt-br', name: 'Portuguese (BR)' },
  { id: 'ja', name: 'Japanese' },
];

const kokoroVoices = [
  { id: 'af_alloy', name: 'Alloy', gender: 'Female', accent: 'American' },
  { id: 'af_aoede', name: 'Aoede', gender: 'Female', accent: 'American' },
  { id: 'af_bella', name: 'Bella', gender: 'Female', accent: 'American' },
  { id: 'af_heart', name: 'Heart', gender: 'Female', accent: 'American' },
  { id: 'af_jessica', name: 'Jessica', gender: 'Female', accent: 'American' },
  { id: 'af_nicole', name: 'Nicole', gender: 'Female', accent: 'American' },
  { id: 'af_nova', name: 'Nova', gender: 'Female', accent: 'American' },
  { id: 'af_sarah', name: 'Sarah', gender: 'Female', accent: 'American' },
  { id: 'am_adam', name: 'Adam', gender: 'Male', accent: 'American' },
  { id: 'am_echo', name: 'Echo', gender: 'Male', accent: 'American' },
  { id: 'am_eric', name: 'Eric', gender: 'Male', accent: 'American' },
  { id: 'am_liam', name: 'Liam', gender: 'Male', accent: 'American' },
  { id: 'am_michael', name: 'Michael', gender: 'Male', accent: 'American' },
];

export default function TextToSpeechPage() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('af_alloy');
  const [language, setLanguage] = useState('en-us');
  const [speed, setSpeed] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    loading: generating,
    error,
    failoverStatus,
    attempts,
    generateWithAi,
    reset
  } = useAiGeneration({
    onSuccess: (result) => {
      setAudioUrl(result.audioUrl);
    }
  });

  const generateSpeech = async () => {
    if (!text.trim()) return;

    reset();
    setAudioUrl(null);
    setIsPlaying(false);
    
    await generateWithAi(async () => {
      let token: string | undefined;
      if (isSupabaseConfigured) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, voice, language, speed }),
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
        throw new Error(data.error || 'Failed to generate speech');
      }

      return data;
    }, 'Text-to-Speech Generation');
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `speech-${Date.now()}.mp3`;
    link.click();
  };

  useEffect(() => {
    document.title = 'Text to Speech - ToolkitHub';
  }, []);

  return (
    <div className="space-y-6">
      <ToolPageHeader
        icon={Mic}
        title="Text to Speech"
        description="Convert text into natural-sounding speech"
        iconBg="bg-gradient-to-br from-cyan-500 to-blue-600"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Enter Your Text</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{text.length} / 10,000</span>
              <span className="text-border">|</span>
              <span>{text.split(/\s+/).filter(w => w).length} words</span>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 10000))}
            className="w-full h-48 p-4 rounded-xl bg-muted/50 border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground"
            placeholder="Type or paste the text you want to convert to speech..."
            maxLength={10000}
          />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-medium text-foreground mb-5">Voice Settings</h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id} className="bg-card">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Voice</label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                {kokoroVoices.map((v) => (
                  <option key={v.id} value={v.id} className="bg-card">
                    {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3 flex items-center justify-between">
                <span>Speed</span>
                <span className="text-primary font-semibold">{speed}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0.5x</span>
                <span>Normal</span>
                <span>2.0x</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            {error && (
              <div className="mb-4">
                <ErrorDisplay 
                  error={error}
                  failoverStatus={failoverStatus}
                  attempts={attempts}
                  onRetry={generateSpeech}
                  loading={generating}
                />
              </div>
            )}

            {(generating || failoverStatus) && (
              <div className="mb-4">
                <FailoverStatus 
                  status={failoverStatus}
                  attempts={attempts}
                  loading={generating}
                />
              </div>
            )}

            <Button
              onClick={generateSpeech}
              disabled={!text.trim() || generating}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Volume2 className="w-4 h-4 mr-2" />
              )}
              {generating ? 'Generating...' : 'Generate Speech'}
            </Button>

            {audioUrl && (
              <div className="mt-4 p-4 bg-muted/50 border border-border rounded-xl">
                <audio 
                  ref={audioRef} 
                  src={audioUrl} 
                  onEnded={handleAudioEnded}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={togglePlay}
                    className="flex-1"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  <Button
                    onClick={downloadAudio}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
