'use client';

import React, { useState, useEffect } from 'react';
import { Link2, Copy, Check, ExternalLink, Trash2, RotateCcw, BarChart3 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import ToolPageHeader from '@/components/tools/ToolPageHeader';
import { Button } from '@/components/ui/button';

interface ShortUrl {
  id: string;
  short_code: string;
  original_url: string;
  clicks: number;
  created_at: string;
}

export default function URLShortenerPage() {
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [originalUrl, setOriginalUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [shortening, setShortening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dbMissingTable, setDbMissingTable] = useState(false);
  const [dbErrorMessage, setDbErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'URL Shortener - ToolkitHub';
    if (isSupabaseConfigured && supabase) {
      fetchUrls();
    }
  }, []);

  const fetchUrls = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setUrls([]);
      setLoading(false);
      setDbMissingTable(false);
      setDbErrorMessage(null);
      return;
    }

    setLoading(true);
    setDbMissingTable(false);
    setDbErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('short_urls')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        const msg = (error as { message?: string })?.message || 'Unknown database error';
        const code = (error as { code?: string })?.code;

        console.error('Error fetching URLs:', error);
        setUrls([]);

        if (code === 'PGRST205' || /short_urls/i.test(msg)) {
          setDbMissingTable(true);
          setDbErrorMessage(
            "Table 'short_urls' is missing. Create it in Supabase to enable URL shortening."
          );
        } else {
          setDbErrorMessage(msg);
        }
      } else {
        setUrls(data || []);
      }
    } catch (err: unknown) {
      console.error('Database connection error:', err);
      setUrls([]);
      setDbErrorMessage((err as { message?: string })?.message || 'Database connection failed');
    }

    setLoading(false);
  };

  const shortenUrl = async () => {
    if (!originalUrl) return;

    if (!isSupabaseConfigured || !supabase) {
      alert('Database not configured. URL shortening is not available.');
      return;
    }

    if (dbMissingTable) {
      alert("Table 'short_urls' is missing. Please create it first.");
      return;
    }

    setShortening(true);

    const shortCode = Math.random().toString(36).substring(2, 8);

    try {
      const { data, error } = await supabase
        .from('short_urls')
        .insert([
          {
            original_url: originalUrl,
            short_code: shortCode,
            clicks: 0,
          }
        ])
        .select();

      if (error) {
        console.error('Error shortening URL:', error);
        alert('Failed to shorten URL. Please try again.');
      } else {
        setUrls([data[0], ...urls]);
        setOriginalUrl('');
      }
    } catch (err) {
      console.error('Database connection error:', err);
      alert('Database connection failed. Please try again later.');
    }
    setShortening(false);
  };

  const deleteUrl = async (id: string) => {
    if (!isSupabaseConfigured || !supabase) return;
    
    try {
      const { error } = await supabase.from('short_urls').delete().eq('id', id);
      if (error) {
        console.error('Error deleting URL:', error);
      } else {
        setUrls(urls.filter(u => u.id !== id));
      }
    } catch (err) {
      console.error('Database connection error:', err);
    }
  };

  const copyToClipboard = (code: string, id: string) => {
    const shortUrl = `${window.location.origin}/s/${code}`;
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <ToolPageHeader
        icon={Link2}
        title="URL Shortener"
        description="Create short links and track performance"
        iconBg="bg-gradient-to-br from-indigo-500 to-blue-600"
      />

      {dbErrorMessage && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-foreground">
          <p className="text-sm font-semibold">URL Shortener not fully configured</p>
          <p className="mt-1 text-xs text-muted-foreground">{dbErrorMessage}</p>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Link2 className="w-5 h-5" />
            </div>
            <input
              type="url"
              placeholder="Paste your long URL here..."
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground"
            />
          </div>
          <Button
            onClick={shortenUrl}
            disabled={!originalUrl || shortening}
            size="lg"
          >
            {shortening ? <RotateCcw className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
            {shortening ? 'Shortening...' : 'Shorten URL'}
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">My Shortened Links</h3>
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
            {urls.length} Links
          </span>
        </div>
        
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading your links...</p>
            </div>
          ) : urls.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No shortened links yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first short link above</p>
            </div>
          ) : (
            urls.map((url) => (
              <div key={url.id} className="p-4 sm:px-6 hover:bg-muted/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{url.original_url}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium text-primary">
                        {typeof window !== 'undefined' ? window.location.host : ''}/s/{url.short_code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(url.short_code, url.id)}
                        className={`p-1.5 rounded-lg transition-all ${
                          copiedId === url.id 
                            ? 'bg-emerald-500/20 text-emerald-500' 
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {copiedId === url.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added on {new Date(url.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BarChart3 className="w-4 h-4" />
                      {url.clicks} clicks
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={url.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => deleteUrl(url.id)}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
