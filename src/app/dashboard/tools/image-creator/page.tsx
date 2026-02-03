'use client';

import React, { useState, useEffect } from 'react';
import { Wand2, Download, RotateCcw, Image as ImageIcon, Maximize2, X } from 'lucide-react';
import useAiGeneration from '@/hooks/useAiGeneration';
import ErrorDisplay from '@/components/ui/error-display';
import FailoverStatus from '@/components/ui/failover-status';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import ToolPageHeader from '@/components/tools/ToolPageHeader';
import { Button } from '@/components/ui/button';

const styles = ['Realistic', 'Anime', 'Digital Art', 'Oil Painting', 'Watercolor', 'Sketch', '3D Render', 'Pixel Art'];

export default function AIImageCreatorPage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Realistic');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const {
    loading,
    error,
    failoverStatus,
    attempts,
    generateWithAi,
    reset
  } = useAiGeneration({
    onSuccess: (result) => {
      setGeneratedImage(result.imageUrl);
      setRevisedPrompt(result.revisedPrompt);
    }
  });

  const generateImage = async () => {
    if (!prompt.trim()) return;

    reset();
    setGeneratedImage(null);
    setRevisedPrompt(null);
    
    await generateWithAi(async () => {
      let token: string | undefined;
      if (isSupabaseConfigured) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt, style }),
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
        throw new Error(data.error || 'Failed to generate image');
      }

      return data;
    }, 'Image Generation');
  };

  const downloadImage = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement('a');
      a.href = generatedImage;
      a.download = `generated-image.png`;
      a.target = '_blank';
      a.click();
    }
  };

  useEffect(() => {
    document.title = 'AI Image Creator - ToolkitHub';
  }, []);

  return (
    <div className="space-y-6">
      <ToolPageHeader
        icon={Wand2}
        title="AI Image Creator"
        description="Generate stunning images with AI"
        iconBg="bg-gradient-to-br from-orange-500 to-amber-600"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-medium text-foreground mb-4">Describe your image</h3>
          
          <div className="space-y-5">
            <div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-64 p-4 rounded-xl bg-muted/50 border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground"
                placeholder="A serene mountain landscape at sunset with dramatic clouds..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Style</label>
              <div className="flex flex-wrap gap-2">
                {styles.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      style === s 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <ErrorDisplay 
                error={error}
                failoverStatus={failoverStatus}
                attempts={attempts}
                onRetry={generateImage}
                loading={loading}
              />
            )}

            {(loading || failoverStatus) && (
              <FailoverStatus 
                status={failoverStatus}
                attempts={attempts}
                loading={loading}
              />
            )}

            <Button
              onClick={generateImage}
              disabled={!prompt.trim() || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Generating...' : 'Generate Image'}
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Result</h3>
            {generatedImage && (
              <Button variant="outline" size="sm" onClick={downloadImage}>
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="aspect-square bg-muted/50 border border-border rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Generating your image...</p>
              </div>
            </div>
          ) : generatedImage ? (
            <div>
              <div className="relative group">
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full aspect-square object-cover rounded-xl border border-border cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setIsFullScreen(true)}
                  onError={(e) => {
                    console.error('Image load error:', generatedImage);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <button
                  onClick={() => setIsFullScreen(true)}
                  className="absolute top-3 right-3 p-2 bg-background/80 hover:bg-background rounded-lg text-foreground opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
              {revisedPrompt && (
                <div className="mt-4 p-4 bg-muted/50 border border-border rounded-xl">
                  <p className="text-xs font-medium text-muted-foreground mb-2">AI Enhanced Prompt:</p>
                  <p className="text-sm text-foreground">{revisedPrompt}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-square bg-muted/50 border border-border rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Your image will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {isFullScreen && generatedImage && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setIsFullScreen(false)}
              className="absolute top-4 right-4 p-2 bg-muted hover:bg-muted/80 rounded-lg text-foreground z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={generatedImage} 
              alt="Generated Full Screen" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
