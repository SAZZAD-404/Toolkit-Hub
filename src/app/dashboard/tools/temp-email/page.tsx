'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mail, RefreshCw, Copy, Check, Inbox, Loader2, Trash2, ChevronDown, ArrowLeft } from 'lucide-react';

type Provider = 'mail.tm';

interface NormalizedEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  timestamp: Date;
  hasAttachments: boolean;
  htmlContent?: string;
  textContent?: string;
  provider: Provider;
}

interface MailTmAccount {
  email: string;
  token: string;
  id: string;
}

export default function TempEmailPage() {
  const [provider, setProvider] = useState<Provider>('mail.tm');
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [mailTmAccount, setMailTmAccount] = useState<MailTmAccount | null>(null);
  
  const [availableDomains, setAvailableDomains] = useState<{domain: string, provider: Provider}[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('mail.tm');
  
  const [inbox, setInbox] = useState<NormalizedEmail[]>([]);
  const [copied, setCopied] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<NormalizedEmail | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({
    left: 0,
    width: 0,
    top: 0,
    placement: 'down' as 'up' | 'down',
    maxHeight: 240
  });

  const generateUsername = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const fetchDomains = async () => {
    try {
      const allDomains: {domain: string, provider: Provider}[] = [];
      
      try {
        const res = await fetch(`/api/temp-email?action=domains&provider=mail.tm`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.domains && Array.isArray(data.domains)) {
            data.domains.forEach((domain: string) => {
              allDomains.push({ domain, provider: 'mail.tm' });
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch domains for mail.tm:', err);
      }
      
      if (allDomains.length === 0) {
        allDomains.push({ domain: 'mail.tm', provider: 'mail.tm' });
      }
      
      setAvailableDomains(allDomains);
      if (allDomains.length > 0) {
        setSelectedDomain(allDomains[0].domain);
        setProvider(allDomains[0].provider);
      }
    } catch (err) {
      console.error('Failed to fetch domains:', err);
      setAvailableDomains([{ domain: 'mail.tm', provider: 'mail.tm' }]);
    }
  };

  const createMailTmAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/temp-email?action=create-account&provider=mail.tm&domain=${encodeURIComponent(selectedDomain)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.account) {
          setMailTmAccount({
            email: data.account.email,
            token: data.account.token,
            id: data.account.id,
          });
          setEmailAddress(data.account.email);
          setInbox([]);
          setSelectedEmail(null);
        } else {
          throw new Error(data.error || 'Failed to create Mail.tm account');
        }
      } else {
        throw new Error('Failed to create Mail.tm account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Mail.tm email');
    } finally {
      setLoading(false);
    }
  };

  const createNewEmail = useCallback(() => {
    // For mail.tm, we need to create an account, not just generate an email
    createMailTmAccount();
  }, []);

  const createEmail = useCallback(() => {
    createMailTmAccount();
  }, []);

  const fetchInbox = useCallback(async () => {
    if (!mailTmAccount) return;
    setRefreshing(true);
    try {
      const params = new URLSearchParams({
        action: 'inbox',
        provider: 'mail.tm',
      });

      const res = await fetch(`/api/temp-email?${params}`, {
        headers: {
          'x-mailtm-token': mailTmAccount.token,
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      
      if (data.success && data.messages && Array.isArray(data.messages)) {
        const messages = data.messages;
        const normalized: NormalizedEmail[] = messages.map((m: any) => ({
          id: m.id,
          from: m.from?.address || 'unknown@unknown.com',
          to: mailTmAccount.email,
          subject: m.subject || '(No Subject)',
          preview: m.intro || '',
          timestamp: new Date(m.createdAt),
          hasAttachments: false,
          provider: 'mail.tm' as Provider,
        }));
        setInbox(normalized);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Fetch inbox error:', err);
      setError('Failed to fetch inbox');
    } finally {
      setRefreshing(false);
    }
  }, [mailTmAccount]);

  const fetchEmailContent = async (email: NormalizedEmail) => {
    try {
      const params = new URLSearchParams({
        action: 'message',
        provider: 'mail.tm',
        messageId: email.id,
      });

      const res = await fetch(`/api/temp-email?${params}`, {
        headers: {
          'x-mailtm-token': mailTmAccount?.token || '',
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        if (data.success && data.message) {
          const msg = data.message;
          
          const normalizedMessage: NormalizedEmail = {
            id: msg.id,
            from: msg.from?.address || 'unknown@unknown.com',
            to: mailTmAccount?.email || '',
            subject: msg.subject || '(No Subject)',
            preview: msg.intro || '',
            timestamp: new Date(msg.createdAt),
            hasAttachments: false,
            htmlContent: msg.html?.join('') || undefined,
            textContent: msg.text || undefined,
            provider: 'mail.tm',
          };

          setSelectedEmail(normalizedMessage);
        }
      }
    } catch (err) {
      console.error('Fetch email content error:', err);
    }
  };

  const deleteMessage = async (email: NormalizedEmail) => {
    try {
      const params = new URLSearchParams({
        provider: 'mail.tm',
        messageId: email.id,
      });

      const res = await fetch(`/api/temp-email?${params}`, {
        method: 'DELETE',
        headers: {
          'x-mailtm-token': mailTmAccount?.token || '',
        }
      });

      const data = await res.json();
      if (data.success) {
        setInbox(inbox.filter(m => m.id !== email.id));
        if (selectedEmail?.id === email.id) {
          setSelectedEmail(null);
        }
      }
    } catch (err) {
      console.error('Delete message error:', err);
    }
  };

  const downloadAttachment = (attachmentId: string, filename: string) => {
    // Mail.tm doesn't support attachments, so this function is not needed
    console.log('Attachments not supported for mail.tm');
  };

  const handleDropdownSelect = (domain: string) => {
    const domainInfo = availableDomains.find(d => d.domain === domain);
    if (domainInfo) {
      setProvider('mail.tm');
      setEmailAddress('');
      setMailTmAccount(null);
      setInbox([]);
      setSelectedEmail(null);
      setError(null);
      setLoading(true);
      
      setSelectedDomain(domain);
      setTimeout(() => createMailTmAccount(), 100);
    }
    setDropdownOpen(false);
  };

  const updateDropdownPosition = useCallback(() => {
    if (!dropdownRef.current || !dropdownOpen) return;
    
    const button = dropdownRef.current.querySelector('button');
    if (!button) return;
    
    const r = button.getBoundingClientRect();
    const MIN_HEIGHT = 120;
    const IDEAL_HEIGHT = 240;
    
    const spaceBelow = window.innerHeight - r.bottom - 8;
    const spaceAbove = r.top - 8;
    
    const openUp = spaceBelow < MIN_HEIGHT && spaceAbove > spaceBelow;
    const maxHeight = Math.max(MIN_HEIGHT, Math.min(IDEAL_HEIGHT, openUp ? spaceAbove : spaceBelow));
    
    setMenuPos({
      left: r.left,
      width: r.width,
      placement: openUp ? "up" : "down",
      maxHeight,
      top: openUp ? r.top : r.bottom,
    });
  }, [dropdownOpen]);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    if (!dropdownOpen) {
      setTimeout(updateDropdownPosition, 0);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    if (availableDomains.length > 0 && !mailTmAccount && !error) {
      createMailTmAccount();
    }
  }, [availableDomains, mailTmAccount]);

  useEffect(() => {
    if (!mailTmAccount) return;
    fetchInbox();
    const interval = setInterval(fetchInbox, 10000);
    return () => clearInterval(interval);
  }, [mailTmAccount, fetchInbox]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const target = event.target as Element;
        const isDropdownClick = target.closest('[data-dropdown-portal]');
        if (!isDropdownClick) {
          setDropdownOpen(false);
        }
      }
    };

    const handleResize = () => {
      if (dropdownOpen) {
        updateDropdownPosition();
      }
    };

    const handleScroll = () => {
      if (dropdownOpen) {
        updateDropdownPosition();
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      updateDropdownPosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [dropdownOpen, updateDropdownPosition]);

  const copyEmail = () => {
    if (!mailTmAccount?.email) return;
    navigator.clipboard.writeText(mailTmAccount.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  };

  useEffect(() => {
    document.title = 'Temporary Email - ToolkitHub';
  }, []);

  return (
    <div className="space-y-6 h-screen overflow-y-auto pb-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
          <div className="tool-header-icon bg-gradient-to-br from-rose-500 to-pink-500 shadow-rose-500/25 w-10 h-10 sm:w-12 sm:h-12">
            <Mail size={20} className="text-white sm:hidden" />
            <Mail size={24} className="text-white hidden sm:block" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white">Temporary Email</h1>
            <p className="text-zinc-400 text-sm sm:text-base">Get a real disposable email address</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="glass-card rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
        <p className="text-sm text-zinc-500 mb-2 sm:mb-3">Your temporary email address</p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 bg-white/[0.02] border border-white/[0.06] rounded-xl min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-cyan-500 to-blue-500">
              {loading ? <Loader2 size={18} className="text-white animate-spin" /> : <Mail size={18} className="text-white" />}
            </div>
            <span className="font-mono text-sm sm:text-lg text-white truncate">
              {loading ? 'Creating...' : mailTmAccount?.email || 'No email'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="w-full sm:w-auto h-11 sm:h-12 pl-3 sm:pl-4 pr-8 sm:pr-10 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm cursor-pointer sm:min-w-[200px] flex items-center justify-between"
              >
                <span className="truncate">@{selectedDomain}</span>
                <ChevronDown size={16} className={`text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {dropdownOpen && typeof window !== 'undefined' && createPortal(
                <div
                  data-dropdown-portal="true"
                  className="fixed bg-zinc-900 border border-white/[0.06] rounded-xl shadow-xl z-[9999] overflow-y-auto"
                  style={{
                    left: menuPos.left,
                    width: Math.max(menuPos.width, 250),
                    maxHeight: menuPos.maxHeight,
                    top: menuPos.placement === "down" 
                      ? menuPos.top 
                      : (menuPos.top - menuPos.maxHeight),
                  }}
                >
                  <div className="p-2">
                    {availableDomains.map(({ domain, provider: domainProvider }) => {
                      const isSelected = selectedDomain === domain;
                      return (
                        <button
                          key={domain}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDropdownSelect(domain);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg text-base transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-violet-500/20 text-violet-400' 
                              : 'text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          @{domain}
                        </button>
                      );
                    })}
                  </div>
                </div>,
                document.body
              )}
            </div>
            
            <button
              onClick={copyEmail}
              disabled={!mailTmAccount?.email}
              className={`p-2.5 sm:p-3.5 rounded-xl transition-all disabled:opacity-50 shrink-0 ${
                copied 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
            <button
              onClick={createEmail}
              disabled={loading}
              className="p-2.5 sm:p-3.5 rounded-xl bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06] transition-all disabled:opacity-50 shrink-0"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        
        <p className="text-xs text-zinc-600 mt-3">
          Emails auto-refresh every 10 seconds. Premium mail.tm domain with secure temporary email service.
        </p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden flex flex-col lg:flex-row h-[60vh] min-h-[400px] max-h-[500px]">
        <div className={`${selectedEmail ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 border-r border-white/[0.06] flex-col lg:shrink-0`}>
          <div className="p-3 sm:p-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox size={18} className="text-zinc-400" />
              <span className="font-medium text-white text-sm">Inbox</span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-400">
                {inbox.length}
              </span>
            </div>
            <button 
              onClick={fetchInbox}
              disabled={refreshing}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {inbox.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                  <Inbox size={24} className="text-zinc-600" />
                </div>
                <p className="text-zinc-500 text-sm">No emails yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] max-h-[400px] overflow-y-auto">
                {inbox.filter(mail => mail && mail.id).map((mail) => (
                  <div
                    key={mail.id}
                    onClick={() => fetchEmailContent(mail)}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedEmail?.id === mail.id 
                        ? 'bg-cyan-500/10 border-l-2 border-l-cyan-500'
                        : 'hover:bg-white/[0.02] border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 bg-gradient-to-br from-cyan-500 to-blue-500">
                        {(mail.from || 'Unknown').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-zinc-400 truncate">{(mail.from || 'Unknown').split('@')[0]}</p>
                          <span className="text-[10px] text-zinc-600 whitespace-nowrap">{formatTime(mail.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-sm font-medium text-white truncate">{mail.subject || '(No Subject)'}</p>
                        </div>
                        {mail.preview && (
                          <p className="text-xs text-zinc-600 truncate mt-0.5">{mail.preview}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`${selectedEmail ? 'flex' : 'hidden lg:flex'} flex-1 flex-col min-w-0`}>
          {selectedEmail ? (
            <>
              <div className="p-3 sm:p-5 border-b border-white/[0.06]">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/[0.06] text-zinc-400"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className="min-w-0">
                      <h4 className="text-base sm:text-lg font-medium text-white truncate">{selectedEmail.subject}</h4>
                      <div className="flex items-center gap-2 sm:gap-3 mt-2 text-sm">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 bg-gradient-to-br from-cyan-500 to-blue-500">
                          {selectedEmail.from.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-zinc-300 text-sm truncate">{selectedEmail.from}</p>
                          <p className="text-xs text-zinc-500 truncate">to {selectedEmail.to}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-zinc-500 hidden sm:block">{formatTime(selectedEmail.timestamp)}</span>
                    <button
                      onClick={() => deleteMessage(selectedEmail)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-5">
                {selectedEmail.htmlContent ? (
                  <div 
                    className="prose prose-invert prose-sm max-w-none text-zinc-300"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                  />
                ) : selectedEmail.textContent ? (
                  <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-sans">
                    {selectedEmail.textContent}
                  </pre>
                ) : selectedEmail.preview ? (
                  <div className="text-sm text-zinc-300">
                    {selectedEmail.preview}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                      <Mail size={24} className="text-zinc-600" />
                    </div>
                    <p className="text-sm text-zinc-500 italic mb-2">No content available for this email</p>
                    <p className="text-xs text-zinc-600">This email may be empty or the content failed to load</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 hidden lg:flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                  <Mail size={32} className="text-zinc-600" />
                </div>
                <p className="text-zinc-400 font-medium">Select an email</p>
                <p className="text-sm text-zinc-600 mt-1">Choose a message from the inbox</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}