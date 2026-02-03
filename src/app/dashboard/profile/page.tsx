'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
// Theme switching removed (dark-only build)
import { User, Settings, Save, Key, Bell, Palette, Globe, Shield, Trash2, LogOut } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  preferences: {
    theme: 'dark' | 'light' | 'auto';
    language: 'en' | 'bn';
    notifications: boolean;
    autoSave: boolean;
  };
}

type DbProfileRow = {
  id: string;
  // Some projects already have an `email` column with NOT NULL constraint.
  // We store it for compatibility (source of truth is Supabase Auth).
  email?: string;

  name: string;
  bio: string;
  avatar_url: string | null;
  theme: 'dark' | 'light' | 'system';
  language: 'en' | 'bn';
  notifications: boolean;
  auto_save: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  // Dark-only build (theme switching disabled)

  const [profile, setProfile] = useState<UserProfile>({
    name: 'AI Developer',
    email: 'developer@example.com',
    bio: 'Building the future with AI tools',
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: true,
      autoSave: true
    }
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security'>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Manual save only (no auto-save)

  const profileForDb = useMemo(() => {
    const mappedTheme = profile.preferences.theme === 'auto' ? 'system' : profile.preferences.theme;
    return {
      // Keep profiles.email in sync for DBs that require it.
      // (Auth email is the source of truth.)
      email: profile.email,
      name: profile.name,
      bio: profile.bio || '',
      avatar_url: profile.avatar || null,
      theme: mappedTheme,
      language: profile.preferences.language,
      notifications: profile.preferences.notifications,
      auto_save: false,
    } as const;
  }, [profile]);

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured) return;

      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      if (user.email) {
        setProfile((p) => ({ ...p, email: user.email! }));
      }

      // Load profile from DB (or create default row)
      const { data: row, error } = await supabase
        .from('profiles')
        .select('id,name,bio,avatar_url,theme,language,notifications,auto_save')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        // Next.js overlay sometimes renders this as {}. Capture a useful message.
        try {
          const props = Object.getOwnPropertyNames(error as any);
          console.error('profiles select error (raw):', error);
          console.error('profiles select error props:', props);
          // Best-effort stringify
          const safe = JSON.stringify(error, props);
          const msg =
            (error as any)?.message ||
            (error as any)?.hint ||
            (error as any)?.details ||
            safe;
          setSaveError(msg || 'Failed to load profile (unknown error).');
        } catch (e) {
          console.error('profiles select error:', error);
          setSaveError('Failed to load profile (unknown error).');
        }
        return;
      }

      if (!row) {
        // Create a default row for this user
        const insertRow: DbProfileRow = {
          id: user.id,
          email: user.email ?? '',
          name: profile.name || '',
          bio: profile.bio || '',
          avatar_url: null,
          theme: 'dark',
          language: 'en',
          notifications: true,
          auto_save: false,
        };
        await supabase.from('profiles').insert(insertRow);
        return;
      }

      setProfile((p) => ({
        ...p,
        name: row.name ?? p.name,
        bio: row.bio ?? p.bio,
        avatar: row.avatar_url ?? undefined,
        preferences: {
          ...p.preferences,
          // Dark-only
          theme: 'dark',
          language: row.language ?? p.preferences.language,
          notifications: row.notifications ?? p.preferences.notifications,
          autoSave: false,
        },
      }));
    })();
  }, []);

  const logout = async () => {
    try {
      if (!isSupabaseConfigured) {
        router.replace('/login');
        return;
      }
      await supabase.auth.signOut();
    } finally {
      router.replace('/login');
    }
  };

  const saveProfile = async (opts?: { silent?: boolean }) => {
    setSaveError(null);

    if (!isSupabaseConfigured) {
      if (!opts?.silent) setSaveError('Supabase is not configured.');
      return;
    }

    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) {
      if (!opts?.silent) setSaveError('You are not logged in.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...profileForDb }, { onConflict: 'id' });
      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch (e: any) {
      console.error(e);
      setSaveError(e?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  // Manual save only (no auto-save)
  const updateProfile = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updatePreference = (key: string, value: any) => {
    // Theme is locked to dark. Ignore any theme changes.
    if (key === 'theme') return;

    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="tool-header-icon bg-gradient-to-br from-blue-600 to-indigo-900 shadow-blue-500/25">
          <User size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Profile & Settings</h1>
          <p className="text-zinc-500 font-medium">Manage your account and preferences</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.06]">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'security', label: 'Security', icon: Shield }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === id
                  ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                    {profile.name.charAt(0)}
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors">
                    <Settings size={14} />
                  </button>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => updateProfile('name', e.target.value)}
                      className="w-full h-12 px-4 rounded-xl input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      readOnly
                      className="w-full h-12 px-4 rounded-xl input-field opacity-80"
                    />
                    <p className="mt-2 text-xs text-zinc-500">Email is managed by login provider (Supabase Auth).</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => updateProfile('bio', e.target.value)}
                  className="w-full h-24 p-4 rounded-xl input-field resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                    <Palette size={16} />
                    Theme
                  </label>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-zinc-400">
                    Dark mode is enabled.
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                    <Globe size={16} />
                    Language
                  </label>
                  <select
                    value={profile.preferences.language}
                    onChange={(e) => updatePreference('language', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl input-field"
                  >
                    <option value="en">English</option>
                    <option value="bn">বাংলা</option>
                  </select>
                </div>
              </div>



              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">General Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <Bell size={16} className="text-zinc-400" />
                      <div>
                        <span className="text-sm font-medium text-white">Push Notifications</span>
                        <p className="text-xs text-zinc-500">Get notified about generation status</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.preferences.notifications}
                      onChange={(e) => updatePreference('notifications', e.target.checked)}
                      className="w-5 h-5 text-blue-500 rounded"
                    />
                  </label>

                  {/* Manual save only: auto-save option removed */}
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Account Security</h3>
                <div className="space-y-3">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut size={16} className="text-zinc-400" />
                      <span className="text-sm font-medium text-white">Log out</span>
                    </div>
                    <span className="text-blue-400 text-sm">Sign out</span>
                  </button>

                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-3">
                      <Key size={16} className="text-zinc-400" />
                      <span className="text-sm font-medium text-white">Change Password</span>
                    </div>
                    <span className="text-blue-400 text-sm">Update</span>
                  </button>

                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <Trash2 size={16} className="text-red-400" />
                      <span className="text-sm font-medium text-red-400">Delete Account</span>
                    </div>
                    <span className="text-red-400 text-sm">Danger</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save / Status */}
          <div className="pt-6 border-t border-white/[0.06] space-y-3">
            {saveError && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {saveError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              {/* Manual save only */}

              <button
                onClick={() => saveProfile()}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  saved
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90'
                } disabled:opacity-50`}
              >
                <Save size={16} className={saving ? 'animate-pulse' : ''} />
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}