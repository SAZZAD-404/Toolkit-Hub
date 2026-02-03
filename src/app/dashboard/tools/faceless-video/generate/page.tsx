'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Sparkles, Copy, Check, Download, 
  Film, Mic, Zap, Settings2, FileText, 
  BookOpen, FolderDown, Loader2, RotateCcw,
  ChevronDown, Layers
} from 'lucide-react';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { ErrorDisplay } from '@/components/ui/error-display';
import { toast } from 'sonner';
import ToolPageHeader from '@/components/tools/ToolPageHeader';
import { Button } from '@/components/ui/button';

const nicheConfig: Record<string, {
  name: string;
  icon: string;
  defaultVideoStyles: string[];
  defaultGenres: string[];
  subjectPlaceholder: string;
  subjectLabel: string;
  showSubject: boolean;
  pageTitle: string;
  pageSubtitle: string;
  ideaSectionTitle: string;
  ideaPlaceholder: string;
  generateButtonText: string;
  projectNamePlaceholder: string;
  projectNameLabel: string;
  subNiches?: { id: string; name: string; icon: string; description: string }[];
  scriptIdeas: { title: string; idea: string }[];
  defaultSettings?: { voiceEnabled: boolean; musicEnabled: boolean; shotsPerScene: string };
}> = {
  'car-restoration': {
    name: 'Car Restoration',
    icon: '🚗',
    defaultVideoStyles: ['Cinematic', 'Documentary', 'ASMR'],
    defaultGenres: ['Automotive', 'Restoration', 'Classic Cars'],
    subjectPlaceholder: 'e.g., 1967 Ford Mustang Fastback',
    subjectLabel: 'Car Name',
    showSubject: true,
    pageTitle: 'Car Restoration Script Generator',
    pageSubtitle: 'Create professional restoration story scripts',
    ideaSectionTitle: 'Describe Your Restoration Story',
    ideaPlaceholder: 'Describe your car restoration story...',
    generateButtonText: 'Generate Script',
    projectNamePlaceholder: 'Lost for 80 Years — WWII Military Truck Restoration',
    projectNameLabel: 'Project Name',
    scriptIdeas: [
      { title: '1967 Mustang Barn Find', idea: 'A forgotten legend found under a pile of junk after 40 years. From rust to glory, focusing on the engine rebuild and body restoration.' },
      { title: 'Abandoned 1970 Charger', idea: 'A complete mechanical and cosmetic restoration of a car left in a desert field. Detailed process of frame-off restoration.' },
      { title: 'Hidden 1969 Camaro SS', idea: 'Discovered in a collapsed garage, bringing back the roar of the V8 engine and the shine of the original metallic paint.' }
    ],
    defaultSettings: { voiceEnabled: true, musicEnabled: true, shotsPerScene: '4' }
  },
  'monkey-village-cooking': {
    name: 'Monkey Village Cooking',
    icon: '🐒',
    defaultVideoStyles: ['Cinematic', 'ASMR', 'Nature'],
    defaultGenres: ['Nature', 'Cooking', 'Wildlife'],
    subjectPlaceholder: 'e.g., Banana curry cooking',
    subjectLabel: 'Recipe name',
    showSubject: true,
    pageTitle: 'Monkey Village ASMR',
    pageSubtitle: 'Photorealistic monkey village cooking',
    ideaSectionTitle: 'Recipe & Atmosphere',
    ideaPlaceholder: 'Describe the recipe and cooking scene...',
    generateButtonText: 'Generate Script',
    projectNamePlaceholder: 'Monkey Chef Cooking Coconut Prawns',
    projectNameLabel: 'Project Name',
    scriptIdeas: [
      { title: 'Bamboo Steamed Dumplings', idea: 'Monkey chefs are preparing traditional mountain dumplings on a bamboo stove. The scene of this food made with fresh bamboo and wild berries will be peaceful.' },
      { title: 'Coconut Shell Seafood', idea: 'Monkeys catch fresh shrimp from the river and cook them inside coconut shells. Great ASMR scenes of fire flames and boiling broth.' },
      { title: 'Tropical Fruit Honey Cake', idea: 'Monkeys are making a huge cake in the forest with wild honey and unknown sweet fruits. This will give a festive vibe.' }
    ],
    defaultSettings: { voiceEnabled: false, musicEnabled: true, shotsPerScene: '4' }
  },
  'animal-village-cooking': {
    name: 'Animal Village Cooking',
    icon: '🦊',
    defaultVideoStyles: ['Cinematic', 'Cute', 'ASMR'],
    defaultGenres: ['Animation', 'Cooking', 'Family'],
    subjectPlaceholder: 'e.g., Fox making pie',
    subjectLabel: 'Animals + Recipe',
    showSubject: true,
    pageTitle: 'Animal Village ASMR',
    pageSubtitle: 'Ultra-realistic animal village cooking',
    ideaSectionTitle: 'Animals & Dishes',
    ideaPlaceholder: 'Which animals are cooking? What dish?',
    generateButtonText: 'Generate Script',
    projectNamePlaceholder: 'The Fox Family Mushroom Soup',
    projectNameLabel: 'Project Name',
    scriptIdeas: [
      { title: 'Fox Family Berry Pie', idea: 'A cozy scene with a family of foxes baking a magical berry pie under the moonlight in their burrow kitchen.' },
      { title: 'Rabbit Chef Garden Stew', idea: 'A hardworking rabbit gathering glowing vegetables from his hidden garden for a wholesome, magical stew.' },
      { title: 'Bear Winter Cabin Soup', idea: 'A cozy bear preparing a warm, hearty soup in his snow-covered cabin during a peaceful blizzard.' }
    ],
    defaultSettings: { voiceEnabled: false, musicEnabled: true, shotsPerScene: '3' }
  },
  'animal-rescue': {
    name: 'Animal Rescue',
    icon: '🛟',
    defaultVideoStyles: ['Cinematic', 'Emotional', 'Documentary'],
    defaultGenres: ['Animals', 'Rescue', 'Compassion'],
    subjectPlaceholder: 'e.g., Dog leads rescuer to trapped puppies',
    subjectLabel: 'Story seed',
    showSubject: false,
    pageTitle: 'Animal Rescue (Visual-Only)',
    pageSubtitle: 'Cinematic rescue micro-films',
    ideaSectionTitle: 'Describe the Rescue Story',
    ideaPlaceholder: 'Describe the hazard, location, animal(s), and rescue outcome...',
    generateButtonText: 'Generate Script',
    projectNamePlaceholder: 'Everyone Walked Past — Until the Dog Led Someone',
    projectNameLabel: 'Project Name',
    scriptIdeas: [
      {
        title: 'Golden Retriever Refused to Leave… and Led a Stranger to a Buried Box',
        idea: 'Hook: In heavy rain, a golden retriever digs frantically in mud, refusing to move. Mystery: Something is buried—faint muffled sounds under the ground. Climax: The stranger pries open a soaked box to reveal struggling kittens; the lid sticks (false setback), then gives. Ending: Warm shelter scene—kittens wrapped in towels, steady breathing, the dog gently licking their heads as proof of safety.'
      },
      {
        title: 'In a Snowstorm, a Stray Cat Chose One Human to Save Her Frozen Kitten',
        idea: 'Hook: Scratching at a window in a blizzard—an anxious stray cat stares, then bolts. Mystery: She keeps looking back, leading the human through snowdrifts. Midpoint reveal: A kitten half-buried in snow, barely moving. Climax: Careful warming and revival (blanket + gentle heat), one scare moment when the kitten goes limp (false setback). Ending: Warm indoor light—mother cat pressed against the kitten, calm breathing and safety proof.'
      },
      {
        title: 'Mother Duck Begged for Help When a Storm Drain Swallowed Her Babies',
        idea: 'Hook: A mother duck panics at a street drain, calling and peering down. Mystery: She keeps counting ducklings—several are missing. Midpoint reveal: Tiny ducklings visible below the grate in dark water. Climax: The rescuer lifts the grate and retrieves ducklings one by one; one slips back (false setback) before being secured. Ending: A clean safe pond/shelter edge—ducklings reunited in a line, tucked under the mother’s wing.'
      },
      {
        title: 'Stray Dog Refused to Leave… and Led a Stranger to an Abandoned Well',
        idea: 'Hook: A stray dog blocks a path, whining, then runs to an overgrown patch of grass. Mystery: The danger is invisible until the camera reveals a deep abandoned well. Midpoint reveal: A faint movement/sound from below. Climax: Rope-and-ladder descent; the rope slips once (false setback) before the rescue succeeds. Ending: Ground-level reunion—nose-to-nose contact, water and blanket, then a warm safe place shot proving the animal is secure.'
      },
      {
        title: 'Koala Searched for Help After Its Burnt Joey Was Found Alive',
        idea: 'Hook: In smoky ash-covered bushland, a koala repeatedly approaches a ranger, then retreats urgently. Mystery: The koala insists on leading the way. Midpoint reveal: A joey alive under debris, singed fur but no graphic wounds. Climax: Gentle extraction and stabilizing care—water drops, cooling cloth, bandage wrap; a tense moment when the joey stops moving briefly (false setback), then breath returns. Ending: Rescue clinic warmth—soft bedding, steady breathing, mother koala close by.'
      }
    ],
    defaultSettings: { voiceEnabled: false, musicEnabled: true, shotsPerScene: '3' }
  },
  'historical-facts': {
    name: 'Historical Mystery',
    icon: '🕵️‍♂️',
    defaultVideoStyles: ['Cinematic', 'Dark', 'Atmospheric'],
    defaultGenres: ['History', 'Mystery', 'Thriller'],
    subjectPlaceholder: 'e.g., The Lost Amber Room',
    subjectLabel: 'Primary Mystery Anchor',
    showSubject: true,
    pageTitle: 'Historical Mystery & Suspense',
    pageSubtitle: 'Transform historical facts into cinematic thrillers',
    ideaSectionTitle: 'Describe the Historical Mystery',
    ideaPlaceholder: 'Describe the historical event with suspense...',
    generateButtonText: 'Generate Script',
    projectNamePlaceholder: 'The Enigma of the Lost Roanoke Colony',
    projectNameLabel: 'Project Name',
    subNiches: [
     { id: 'ancient-secrets', name: 'Ancient Secrets', icon: '🏺', description: 'Ancient engineering and unexplained wonders.' },
     { id: 'lost-treasures', name: 'Lost Treasures', icon: '💰', description: 'Legendary wealth and forgotten artifacts.' },
     { id: 'dark-history', name: 'Dark History & Crime', icon: '☠️', description: 'Cold cases and mysterious figures.' },
     { id: 'mayajal-style', name: 'Mayajal Style', icon: '👁️', description: 'High-engagement mystery and facts.' },
     ],
      scriptIdeas: [
        { title: 'The Lost Roanoke Colony', idea: 'Exploring the mystery of 115 settlers who vanished without a trace in 1590, leaving only a cryptic word carved into a tree. Focus on the abandoned settlement and the eerie silence.' },
        { title: 'Ghost Ship SS Baychimo', idea: 'The haunting story of a ship that sailed the Arctic waters without a crew for 40 years, appearing and disappearing like a phantom in the fog.' },
        { title: 'The Amber Room Mystery', idea: 'A cinematic journey tracing the disappearance of the world-famous Amber Room during WWII, moving through secret bunkers and forgotten archives.' },
        { title: 'Pompeii Final Hours', idea: 'A tense, hour-by-hour countdown of the final day in Pompeii, focusing on a single family trying to escape as the sky turns black.' },
        { title: 'The Voynich Manuscript', idea: 'Tracing the history of the world\'s most mysterious book. An undecipherable text with bizarre illustrations of unknown plants and celestial maps.' },
        { title: 'Jack the Ripper Evidence', idea: 'A dark, Victorian-era investigation into the unidentified serial killer. Focus on the foggy streets of London and the cryptic letters sent to police.' }
        ],
    defaultSettings: { voiceEnabled: true, musicEnabled: true, shotsPerScene: '4' }
  },
};

const storyStyles = [
  { id: 'voiceover', name: 'Voice Over', icon: Mic },
  { id: 'mixed', name: 'Mixed', icon: Settings2 },
  { id: 'cinematic', name: 'Cinematic', icon: Film },
];

const durationOptions = [
  { value: '1', label: '1 Min (8 scenes)' },
  { value: '2', label: '2 Min (15 scenes)' },
  { value: '3', label: '3 Min (23 scenes)' },
  { value: '5', label: '5 Min (38 scenes)' },
  { value: '10', label: '10 Min (75 scenes)' },
  { value: '15', label: '15 Min (113 scenes)' },
];

interface Scene {
  scene_number: number;
  description: string;
  audio_mix?: { audio_content_in_English?: string };
  narration_text?: string;
}

interface GeneratedScript {
  title: string;
  hook: string;
  synopsis?: string;
  scenes: Scene[];
  cta: string;
  hashtags: string[];
  pipeline?: any;
}

function FacelessVideoGenerateInner() {
  const searchParams = useSearchParams();
  const nicheId = searchParams.get('niche') || 'historical-facts';
  const currentNiche = nicheConfig[nicheId] || nicheConfig['historical-facts'];

  const [projectName, setProjectName] = useState('');
  const [historicalSubNiche, setHistoricalSubNiche] = useState('ancient-secrets');
  const [ideaText, setIdeaText] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [storyStyle, setStoryStyle] = useState('cinematic');
  const [outputFormat, setOutputFormat] = useState<'text-to-video' | 'tti-i2v'>('text-to-video');
  const [videoStyles, setVideoStyles] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [videoDuration, setVideoDuration] = useState('3');
  const [shotsPerScene, setShotsPerScene] = useState('3');
  const [aiProvider, setAiProvider] = useState('openrouter');
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [generatedFormat, setGeneratedFormat] = useState<'text-to-video' | 'tti-i2v'>('text-to-video');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isTextDownloading, setIsTextDownloading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [expandedScenes, setExpandedScenes] = useState<number[]>([]);

  const activeConfig = useMemo(() => {
    if (nicheId === 'historical-facts' && historicalSubNiche) {
      const sub = currentNiche.subNiches?.find(s => s.id === historicalSubNiche);
      if (sub) return { ...currentNiche, pageSubtitle: sub.description };
    }
    return currentNiche;
  }, [nicheId, historicalSubNiche, currentNiche]);

  const { loading, error, failoverStatus, attempts, generateWithAi, reset: resetError } = useAiGeneration({
    onSuccess: (result) => {
      const next = { ...(result.script as any) };
      if (outputFormat === 'text-to-video' && next.pipeline) delete next.pipeline;
      setGeneratedFormat(outputFormat);
      setScript(next);
      setGenerationProgress(100);
      toast.success('Script generated!', { description: `${next.scenes?.length || 0} scenes` });
    },
    onError: (msg) => {
      setGenerationProgress(0);
      toast.error('Generation failed', { description: msg });
    }
  });

  useEffect(() => {
    if (activeConfig) {
      setVideoStyles(activeConfig.defaultVideoStyles.slice(0, 3));
      setGenres(activeConfig.defaultGenres.slice(0, 3));
      if (activeConfig.defaultSettings) {
        setVoiceEnabled(activeConfig.defaultSettings.voiceEnabled);
        setMusicEnabled(activeConfig.defaultSettings.musicEnabled);
        setShotsPerScene(activeConfig.defaultSettings.shotsPerScene);
      }
    }
  }, [nicheId, activeConfig]);

  const calculatedScenes = useMemo(() => {
    const n = Number(videoDuration);
    return Math.min(Math.max(Math.ceil((Number.isFinite(n) ? n : 0) * 7.5), 8), 113);
  }, [videoDuration]);

  const generateScript = async () => {
    if (!projectName.trim() || !ideaText.trim()) {
      toast.error('Missing Info', { description: 'Project name and description required' });
      return;
    }
    resetError();
    setGenerationProgress(5);
    setScript(null);

    await generateWithAi(async () => {
      let token: string | undefined;
      if (isSupabaseConfigured) {
        for (let i = 0; i < 20; i++) {
          const { data } = await supabase.auth.getSession();
          token = data?.session?.access_token;
          if (token) break;
          await new Promise(r => setTimeout(r, 250));
        }
      }
      if (isSupabaseConfigured && !token) throw new Error('Please login first');

      let batch: any = { startScene: 1, continuityAnchor: null };
      let acc: any = null;
      const gid = crypto?.randomUUID?.() || String(Date.now());

      while (batch) {
        const res = await fetch('/api/faceless-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            generationId: gid, topic: ideaText, projectName, subjectName, niche: nicheId,
            subNiche: nicheId === 'historical-facts' ? historicalSubNiche : undefined,
            style: storyStyle, videoStyles, genres, language: 'en', voiceGender: 'male',
            voiceEnabled, musicEnabled, videoDuration, shotsPerScene: parseInt(shotsPerScene),
            aiProvider, aiModel: 'openai/gpt-4o-mini', outputFormat,
            startScene: batch.startScene, continuityAnchor: batch.continuityAnchor
          }),
        });
        const ct = res.headers.get('content-type');
        if (!res.ok) {
          const d = ct?.includes('json') ? await res.json() : null;
          throw new Error(d?.error || `Error: ${res.status}`);
        }
        const data = ct?.includes('json') ? await res.json() : (() => { throw new Error('Invalid response'); })();
        if (batch.startScene === 1) acc = data.script;
        else acc.scenes = [...acc.scenes, ...(data.scenes || [])];
        setGenerationProgress(data.progress ?? (data.nextBatch ? 20 : 100));
        batch = data.nextBatch || null;
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('documents').insert({ title: projectName, content: JSON.stringify(acc), user_id: user.id, metadata: { niche: nicheId, type: 'faceless-script' } });
            await supabase.from('activity_log').insert({ user_id: user.id, action: `Generated ${currentNiche.name} Script`, target: 'Faceless Video', project_name: projectName, status: 'completed' });
          }
        } catch {}
      }
      return { script: acc };
    }, 'Faceless Script Generation');
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
    toast.success('Copied');
  };

  const formatSceneText = (scene: any) => {
    const lines = [`SCENE ${scene.scene_number}`, '-'.repeat(40), scene.description];
    const voice = scene.audio_mix?.audio_content_in_English || scene.narration_text;
    if (voice) lines.push('', 'Narration:', voice);
    return lines.join('\n');
  };

  const downloadSingleScene = (scene: any) => {
    const blob = new Blob([formatSceneText(scene)], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `scene-${String(scene.scene_number).padStart(3, '0')}.txt`;
    a.click();
    toast.success(`Scene ${scene.scene_number} downloaded`);
  };

  const downloadAsZip = async () => {
    if (!script?.scenes) return;
    try {
      setIsBulkDownloading(true);
      const res = await fetch('/api/archive-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: script.scenes, metadata: { title: script.title, hook: script.hook, synopsis: script.synopsis, cta: script.cta } })
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(script.title || 'script').replace(/\s+/g, '-').toLowerCase()}.zip`;
      a.click();
      toast.success('ZIP downloaded');
    } catch { toast.error('ZIP failed'); }
    finally { setIsBulkDownloading(false); }
  };

  const downloadAsText = async () => {
    if (!script?.scenes) return;
    try {
      setIsTextDownloading(true);
      const res = await fetch('/api/archive-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: script.scenes, format: 'text', metadata: { title: script.title } })
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(script.title || 'script').replace(/\s+/g, '-').toLowerCase()}.txt`;
      a.click();
      toast.success('TXT downloaded');
    } catch { toast.error('TXT failed'); }
    finally { setIsTextDownloading(false); }
  };

  const buildPromptPackText = (s: GeneratedScript) => {
    const p = (s as any).pipeline;
    if (!p || p.mode !== 'tti-i2v') return '';
    const tti = p.text_to_image || [];
    const i2v = p.image_to_video || [];
    const lines = [`TITLE: ${s.title}`, `SYNOPSIS: ${s.synopsis || ''}`, ''];
    s.scenes.forEach(sc => {
      const n = sc.scene_number;
      lines.push(`Scene ${n}`, `TTI: ${tti.find((x: any) => x.scene_number === n)?.prompt || ''}`, `I2V: ${i2v.find((x: any) => x.scene_number === n)?.prompt || ''}`, '');
    });
    return lines.join('\n');
  };

  useEffect(() => { document.title = `${currentNiche.pageTitle} - ToolkitHub`; }, [currentNiche.pageTitle]);

  return (
    <div className="space-y-6">
      <ToolPageHeader icon={Film} title={currentNiche.pageTitle} description={activeConfig.pageSubtitle} iconBg="bg-gradient-to-br from-violet-500 to-purple-600" />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-sm font-medium text-foreground mb-4">Project Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{currentNiche.projectNameLabel} *</label>
                <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder={currentNiche.projectNamePlaceholder} className="w-full p-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground" />
              </div>
              {currentNiche.showSubject && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{currentNiche.subjectLabel}</label>
                  <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder={currentNiche.subjectPlaceholder} className="w-full p-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground" />
                </div>
              )}
              {nicheId === 'historical-facts' && currentNiche.subNiches && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Sub-Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {currentNiche.subNiches.map(sub => (
                      <button key={sub.id} onClick={() => setHistoricalSubNiche(sub.id)} className={`p-3 rounded-xl text-left transition-all ${historicalSubNiche === sub.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'}`}>
                        <span className="text-lg mr-2">{sub.icon}</span>
                        <span className="text-xs font-medium">{sub.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {currentNiche.scriptIdeas.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Quick Templates</label>
                  <select onChange={e => { if (e.target.value) { const s = currentNiche.scriptIdeas[parseInt(e.target.value)]; setProjectName(s.title); setIdeaText(s.idea); toast.success('Template applied'); e.target.value = ''; } }} className="w-full p-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Select a template...</option>
                    {currentNiche.scriptIdeas.map((idea, i) => <option key={i} value={i} className="bg-card">{idea.title}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">{currentNiche.ideaSectionTitle}</h3>
              <span className="text-xs text-muted-foreground">{ideaText.length}/2000</span>
            </div>
            <textarea value={ideaText} onChange={e => setIdeaText(e.target.value)} placeholder={currentNiche.ideaPlaceholder} className="w-full h-48 p-4 rounded-xl bg-muted/50 border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground" maxLength={2000} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-sm font-medium text-foreground mb-5">Generation Settings</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Output Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setOutputFormat('text-to-video')} className={`p-3 rounded-xl text-sm font-medium transition-all ${outputFormat === 'text-to-video' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'}`}>Text → Video</button>
                  <button onClick={() => setOutputFormat('tti-i2v')} className={`p-3 rounded-xl text-sm font-medium transition-all ${outputFormat === 'tti-i2v' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'}`}>Text → Image → Video</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Story Style</label>
                <div className="flex flex-wrap gap-2">
                  {storyStyles.map(s => (
                    <button key={s.id} onClick={() => setStoryStyle(s.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${storyStyle === s.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'}`}>
                      <s.icon className="w-4 h-4" />{s.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Duration <span className="text-xs text-muted-foreground">({calculatedScenes} scenes)</span></label>
                <select value={videoDuration} onChange={e => setVideoDuration(e.target.value)} className="w-full p-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {durationOptions.map(opt => <option key={opt.value} value={opt.value} className="bg-card">{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">AI Provider</label>
                <select value={aiProvider} onChange={e => setAiProvider(e.target.value)} className="w-full p-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="openrouter" className="bg-card">OpenRouter</option>
                  <option value="openai" className="bg-card">OpenAI</option>
                  <option value="github" className="bg-card">GitHub Models</option>
                  <option value="groq" className="bg-card">Groq</option>
                </select>
              </div>
            </div>
            {error && <div className="mt-4"><ErrorDisplay error={error} failoverStatus={failoverStatus} attempts={attempts} onRetry={generateScript} loading={loading} /></div>}
            <div className="mt-6">
              <Button onClick={generateScript} disabled={!projectName.trim() || !ideaText.trim() || loading} className="w-full" size="lg">
                {loading ? <RotateCcw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {loading ? 'Generating...' : currentNiche.generateButtonText}
              </Button>
              {loading && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2"><span>Generating {calculatedScenes} scenes...</span><span>{Math.round(generationProgress)}%</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${generationProgress}%` }} /></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {script && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{script.title}</h3>
              <p className="text-sm text-muted-foreground">{script.scenes?.length || 0} scenes generated</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadAsText} disabled={isTextDownloading}>{isTextDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}TXT</Button>
              <Button variant="outline" size="sm" onClick={downloadAsZip} disabled={isBulkDownloading}>{isBulkDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderDown className="w-4 h-4 mr-2" />}ZIP</Button>
              {generatedFormat === 'text-to-video' && <Button size="sm" onClick={() => copyToClipboard(JSON.stringify(script, null, 2), 'all')}><Copy className="w-4 h-4 mr-2" />Copy JSON</Button>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {script.synopsis && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-2"><BookOpen className="w-4 h-4 text-primary" /><span className="text-xs font-medium text-muted-foreground uppercase">Synopsis</span></div>
                <p className="text-sm text-foreground italic">{script.synopsis}</p>
              </div>
            )}
            {script.hook && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-amber-500" /><span className="text-xs font-medium text-muted-foreground uppercase">Hook</span></div>
                <p className="text-sm text-foreground">{script.hook}</p>
              </div>
            )}
          </div>

          {generatedFormat === 'tti-i2v' && (script as any).pipeline?.mode === 'tti-i2v' && (
            <div className="mb-6 p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-foreground">Prompt Pack</span></div>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(buildPromptPackText(script), 'prompt-pack')}>{copiedSection === 'prompt-pack' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
              </div>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-64 overflow-auto bg-background p-3 rounded-lg">{buildPromptPackText(script)}</pre>
            </div>
          )}

          {generatedFormat === 'text-to-video' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Scenes</h4>
              {script.scenes.map((scene, i) => (
                <div key={i} className="border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setExpandedScenes(p => p.includes(scene.scene_number) ? p.filter(n => n !== scene.scene_number) : [...p, scene.scene_number])} className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">{scene.scene_number}</div>
                      <span className="text-sm text-foreground text-left line-clamp-1">{scene.description.slice(0, 100)}...</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedScenes.includes(scene.scene_number) ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedScenes.includes(scene.scene_number) && (
                    <div className="p-4 pt-0 space-y-4 border-t border-border">
                      <div className="bg-muted/30 p-3 rounded-lg"><p className="text-sm text-foreground whitespace-pre-line">{scene.description}</p></div>
                      {(scene.audio_mix?.audio_content_in_English || scene.narration_text) && (
                        <div>
                          <div className="flex items-center gap-2 mb-2"><Mic className="w-3 h-3 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Narration</span></div>
                          <p className="text-sm text-muted-foreground italic">"{scene.audio_mix?.audio_content_in_English || scene.narration_text}"</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(formatSceneText(scene), `scene-${scene.scene_number}`)}>{copiedSection === `scene-${scene.scene_number}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 mr-1" />}Copy</Button>
                        <Button variant="outline" size="sm" onClick={() => downloadSingleScene(scene)}><Download className="w-4 h-4 mr-1" />Download</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
}

export default function FacelessVideoGeneratePageWrapper() {
  return <Suspense fallback={<LoadingFallback />}><FacelessVideoGenerateInner /></Suspense>;
}
