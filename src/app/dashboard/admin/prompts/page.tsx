'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

type PromptRow = {
  id: string;
  niche: string;
  title: string;
  prompt_text: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

const NICHES = [
  { id: 'car-restoration', name: 'Car Restoration' },
  { id: 'monkey-cooking', name: 'Monkey Cooking' },
  { id: 'animal-cooking', name: 'Animal Cooking' },
  { id: 'historical-mystery', name: 'Historical Mystery' },
  { id: 'animal-rescue', name: 'Animal Rescue' },
];

export default function AdminPromptsPage() {
  const router = useRouter();
  const [niche, setNiche] = useState(NICHES[0].id);
  const [rows, setRows] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  const nicheName = useMemo(() => NICHES.find(n => n.id === niche)?.name ?? niche, [niche]);

  const load = async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      router.push('/dashboard');
      return;
    }

    const res = await fetch(`/api/admin/prompts?niche=${encodeURIComponent(niche)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Forbidden');
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(json.prompts || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [niche]);

  const createPrompt = async () => {
    setError(null);
    setSuccess(null);

    if (!newTitle.trim() || !newPrompt.trim()) {
      setError('Title and prompt are required');
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      setError('Unauthorized');
      return;
    }

    const res = await fetch('/api/admin/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ niche, title: newTitle.trim(), promptText: newPrompt.trim() }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed');
      return;
    }

    setNewTitle('');
    setNewPrompt('');
    setSuccess('Prompt created');
    await load();
  };

  const update = async (id: string, patch: Partial<{ title: string; prompt_text: string; active: boolean }>) => {
    setError(null);
    setSuccess(null);

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      setError('Unauthorized');
      return;
    }

    const res = await fetch('/api/admin/prompts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        id,
        title: patch.title,
        promptText: patch.prompt_text,
        active: patch.active,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed');
      return;
    }

    setSuccess('Updated');
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Script prompts</h1>
          <p className="text-zinc-400">Manage prompts by niche (add/edit/disable)</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Niche</div>
            <div className="text-sm font-semibold text-white mt-1">{nicheName}</div>
          </div>
          <select value={niche} onChange={(e) => setNiche(e.target.value)} className="p-3 rounded-xl input-field text-sm">
            {NICHES.map(n => (
              <option key={n.id} value={n.id} className="bg-[#050505]">{n.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-sm font-bold text-white">Add new prompt</div>
            <div className="mt-3 space-y-3">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full p-3 rounded-xl input-field text-sm" placeholder="Title" />
              <textarea value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} className="w-full min-h-48 p-3 rounded-xl input-field text-sm resize-none" placeholder="Prompt text" />
              <button onClick={createPrompt} className="w-full py-3 rounded-xl btn-primary">Create</button>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-sm font-bold text-white">Existing prompts</div>
            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="text-sm text-zinc-500">Loading…</div>
              ) : rows.length === 0 ? (
                <div className="text-sm text-zinc-500">No prompts yet. Add one.</div>
              ) : (
                rows.map((p) => (
                  <PromptEditor key={p.id} row={p} onSave={update} />
                ))
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5" />
            <span>{success}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PromptEditor({ row, onSave }: { row: PromptRow; onSave: (id: string, patch: any) => Promise<void> }) {
  const [title, setTitle] = useState(row.title);
  const [text, setText] = useState(row.prompt_text);
  const [active, setActive] = useState(row.active);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 p-2 rounded-lg input-field text-sm" />
        <label className="text-xs text-zinc-400 flex items-center gap-2">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active
        </label>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} className="mt-3 w-full min-h-28 p-2 rounded-lg input-field text-xs resize-none" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => onSave(row.id, { title, prompt_text: text, active })} className="py-2.5 rounded-xl btn-secondary text-sm">Save</button>
        <button onClick={() => onSave(row.id, { active: false })} className="py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/15 transition text-sm font-semibold">Disable</button>
      </div>
    </div>
  );
}
