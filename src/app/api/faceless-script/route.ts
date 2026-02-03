import { NextRequest, NextResponse } from 'next/server';
import { generateWithTextAI, TextGenProvider, ProviderConfig } from '@/lib/ai-manager';
import { getNichePrompt, getNicheMetadata } from '@/lib/niche-prompts';
import { checkCredits, hasChargedGeneration, logUsageAndCharge } from '@/lib/usage';
import { creditsForTool } from '@/lib/credits';
import { createClient } from '@supabase/supabase-js';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function parseAIJsonSafe(content: string): any {
  if (!content) throw new Error("Empty content");
  
  // Remove markdown code fences and clean up
  let cleaned = content.replace(/^```json\s*|```\s*$/gi, "").trim();
  
  // Remove all control characters that break JSON
  cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]+/g, "");
  
  // More aggressive string cleaning - replace problematic characters in strings
  cleaned = cleaned.replace(/"([^"]*?)"/g, (match, content) => {
    // Clean the content inside quotes
    const cleanContent = content
      .replace(/\n/g, " ")  // Replace newlines with spaces
      .replace(/\r/g, " ")  // Replace carriage returns with spaces
      .replace(/\t/g, " ")  // Replace tabs with spaces
      .replace(/\\/g, "")   // Remove backslashes
      .replace(/"/g, "'")   // Replace inner quotes with single quotes
      .replace(/\s+/g, " ") // Collapse multiple spaces
      .trim();
    return `"${cleanContent}"`;
  });
  
  // Fix common JSON issues
  cleaned = cleaned
    .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // Quote unquoted keys

  // Find JSON boundaries
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const start = firstBracket !== -1 && (firstBracket < firstBrace || firstBrace === -1) ? firstBracket : firstBrace;

  if (start === -1) {
    throw new Error("No JSON structure found");
  }

  let jsonStr = cleaned.slice(start);
  
  // Try to parse as-is first
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    // If that fails, try to close the JSON properly
    const openBraces = (jsonStr.match(/\{/g) || []).length;
    const closeBraces = (jsonStr.match(/\}/g) || []).length;
    const openBrackets = (jsonStr.match(/\[/g) || []).length;
    const closeBrackets = (jsonStr.match(/\]/g) || []).length;
    
    // Add missing closing brackets
    for (let i = 0; i < (openBraces - closeBraces); i++) jsonStr += "}";
    for (let i = 0; i < (openBrackets - closeBrackets); i++) jsonStr += "]";
    
    try {
      return JSON.parse(jsonStr);
    } catch (finalErr) {
      console.error("JSON parsing failed completely:", (finalErr as Error).message);
      console.error("Cleaned JSON string:", jsonStr.slice(0, 1000));
      
      // Try to extract partial scenes from truncated JSON
      try {
        // Look for complete scene objects in the truncated JSON
        const sceneMatches = jsonStr.match(/\{\s*"scene_number"[^}]+\}/g);
        if (sceneMatches && sceneMatches.length > 0) {
          const partialScenes = sceneMatches.map(match => {
            try {
              return JSON.parse(match);
            } catch {
              return null;
            }
          }).filter(Boolean);
          
          if (partialScenes.length > 0) {
            console.log(`Recovered ${partialScenes.length} partial scenes from truncated response`);
            return {
              scenes: partialScenes,
              title: "Generated Script (Partial)",
              synopsis: "Script generation was truncated but partial scenes were recovered",
              hook: "",
              cta: "",
              hashtags: []
            };
          }
        }
      } catch (recoveryErr) {
        console.error("Scene recovery failed:", recoveryErr);
      }
      
      // Return a minimal fallback structure
      return {
        scenes: [{
          scene_number: 1,
          scene_id: "scene-1",
          dialogue_summary: "",
          duration: "8s",
          description: "Script generation encountered JSON parsing issues. Please try again with a simpler prompt.",
          rendering_style: "Ultra-realistic CGI: High-quality video rendering with professional production values",
          visual_style: "Cinematic atmosphere",
          cinematography_style: "Professional camera work",
          visuals: {
            subject: "Main character",
            environment: "Consistent setting",
            lighting_style: "Cinematic lighting",
            color_palette: "Professional palette",
            overall_aesthetic: "Ultra-realistic look"
          },
          niche_optimization: {},
          characters_in_scene: [{
            name: "Main Character",
            identity_anchor_prompt: "A cinematic main character with consistent appearance.",
            current_action: "Performing scene actions.",
            visual_details: "Detailed features."
          }],
          visual_states: [],
          camera: "Cinematic tracking shot.",
          audio_mix: {
            ambience_track: {
              primary_ambience: "Natural atmosphere",
              volume_level: "0.2"
            },
            sfx_cues: [],
            audio_content_in_English: "Script generation encountered parsing issues. Please try again."
          }
        }],
        title: "Generated Script",
        synopsis: "Script generation encountered parsing issues",
        hook: "",
        cta: "",
        hashtags: []
      };
    }
  }
}

function getMaxScenesForDuration(durationMinutes: number): number {
  const scenesPerMinute = 7.5;
  // UI shows 1 minute ≈ 7-8 scenes; keep minimum aligned with frontend
  // Global cap: 15 minutes max (≈112-113 scenes)
  return Math.min(Math.max(Math.ceil(durationMinutes * scenesPerMinute), 8), 113);
}

const GLOBAL_MASTER_RULE_PROMPT = `
GLOBAL MASTER RULE PROMPT (ALL NICHES)

You are a PROFESSIONAL cinematic scriptwriter and director for a high-end faceless video system.
Your goal is to produce a SEAMLESS, CONTINUOUS SHORT FILM broken into sequential 8-second scenes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CORE PRINCIPLES (MUST FOLLOW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1) SEAMLESS PROFESSIONAL NARRATIVE (GLOBAL)
- Generate a seamless, professional video narrative for any given niche.
- Ensure that each video segment follows a logical, continuous flow, with no abrupt breaks or missing steps.
- Each scene should naturally transition into the next, maintaining consistency in tone, pacing, and detail.
- Include all critical steps relevant to the niche, ensuring that no important actions or transitions are skipped.
- The final output should look like a cohesive, realistic story that feels natural and human-like, avoiding any artificial patterns or inconsistencies.
- The entire video must be ONE continuous serial narrative from Scene 1 to the end.

2) DOCUMENTARY FLOW & LOGICAL PROGRESSION (CRITICAL)
- For any project-based or process-oriented narrative (e.g., Car Restoration, Building, Exploration), you MUST follow a logical, step-by-step documentary progression.
- DO NOT skip essential phases. For a restoration project, the sequence MUST be: Discovery of the subject -> Transporting to the workspace -> Initial thorough inspection -> Cleaning/Stripping -> Preparation -> Actual Repair/Work -> Final Assembly -> Cinematic Reveal.
- The narrative must maintain continuity, avoiding any abrupt jumps or missing steps. The final output should look like a cohesive, realistic documentary.

3) SCENE DURATION & CAMERA ANGLES
- Each scene is EXACTLY 8 seconds.
- Every scene MUST contain 3 to 4 distinct, UNIQUE camera shot angles with exact timestamps.
- Format: • (0s → 3s) [SHOT TYPE]: Detail...
- CAMERA SHOT VARIETY: Do NOT repeat camera directions between scenes. If Scene 1 starts with a WIDE-SHOT, Scene 2 might start with a CLOSE-UP or a TRACKING-SHOT. Use variety: LOW-ANGLE, BIRD-EYE, HOLLYWOOD-DOLLY, MACRO-DETAIL, etc.

4) BACKGROUND NARRATION / VOICEOVER (MANDATORY)
- Every scene MUST include background narration that tells the story as it unfolds.
- HUMAN-LIKE NARRATION: Maintain a consistent, human-like narration tone from start to finish.
- AUTHENTIC STORYTELLING: Avoid mechanical or formulaic phrasing. Mimic natural human storytelling with subtle pauses, emotional nuances, and realistic actions.
- Use engaging, storytelling-focused language. NO repetitive "In this scene..." or "Now we see...". Talk like a narrator of a high-end documentary or thriller.
- Spoken narration MUST be placed in "audio_mix.audio_content_in_English".

5) HYPER-DETAILED EXTREME SCALING
- Provide HYPER-DETAILED descriptions for every second of the video.
- Duration = Depth. You must describe micro-moments, atmosphere, textures, and sensory details.
- EXTREME DEPTH RULE: Describe the sub-surface scattering of skin/fur, the specific wavelength of light reflections, and microscopic atmospheric details.
- PERFORMANCE DEPTH: Describe characters through their micro-expressions and psychological state.

6) CONTINUITY LOCK (STRICT)
- Maintain absolute consistency for characters (identity, physical traits, fur/skin texture).
- Maintain absolute consistency for environment (lighting, props, geography).
- Use continuity anchors to ensure the story never breaks.

7) SEAMLESS ALIGNMENT & "CONTINUOUS SHOT" FEEL
- NO visible cuts between scenes. Every scene must feel like it was filmed in one continuous take.
- Every scene MUST end in a way that naturally flows into the next scene.
- Align the atmosphere, pacing, and emotional tone of the ending of one scene with the start of the next.
- MANDATORY TRANSITION: Every scene MUST end with: "Transition into next scene: Motion continues seamlessly using match-cut, motion bridge, and audio bridge."

8) MULTI-CHARACTER COORDINATION & INDIVIDUAL BREAKDOWN
- When multiple characters are present, describe their physical coordination and collective action.
- Provide individual character breakdowns (posture, hand movement, head direction) for EVERY character.

9) STORY PROGRESSION & ANTI-LOOPING (STRICT)
- The narrative MUST move forward in time. NEVER repeat or regenerate the same action.
- Each new scene must build upon the last—ensuring a natural, evolving storyline without redundancy.
- Ensure the narration provides a coherent, engaging storytelling experience from start to finish.

10) EMOTIONAL TRANSITIONS & VOICE CONSISTENCY
- Maintain the same voice type (e.g., male or female) throughout, with consistent tone and pacing.
- The narrator should adjust naturally to emotional shifts (calm, intense, reflective) while maintaining the same style.
- The narration and actions should be human-like, realistic, and free from any artificial patterns.

11) STRICT CHARACTER CONSISTENCY & PHYSICAL LOCK (MANDATORY)
- Characters and concepts MUST NOT be random.
- PHYSICAL LOCK (Visual DNA): The character's face, body color (skin/fur), and body shape/proportions MUST remain 100% identical from Scene 1 to the final scene.
- MANDATORY IDENTITY ANCHOR COMPONENTS: The "identity_anchor_prompt" MUST explicitly include:
a) Face: Precise facial structure, eyes, features.
b) Body Color: Skin tone or fur pattern/color.
c) Body Shape: Proportions, height, and build.
- No wardrobe changes unless the script explicitly requires it for the story.
- ROLE & OCCUPATION LOCK: A character's role (e.g., shopkeeper, customer, driver) MUST be established in their first appearance and remain consistent. Role-swapping is STIRCTLY FORBIDDEN.
- ACTION FLOW CONSISTENCY: Characters must follow a logical sequence of actions based on their role.
- Character drift or changing body proportions is strictly forbidden.
- MANDATORY: You MUST populate "characters_in_scene" for EVERY scene with the SAME "identity_anchor_prompt".
- The "identity_anchor_prompt" (30-50 words) MUST be a permanent visual DNA: (e.g., "A 35-year-old lean Caucasian man with a sharp square jawline and deep-set blue eyes. Skin is a weathered tan. He has a muscular, athletic body shape. Wearing a deep navy linen shirt.")
- CRITICAL: Use this EXACT visual DNA in the main "description" and "visuals.subject" field for EVERY scene.

  12) ABSOLUTE SCRIPT-BASED CONTINUITY (CRITICAL)
  - Everything that happens in the video MUST be explicitly described in the script.
  - DO NOT leave any visual details to chance. If a character is holding a specific tool, it must be mentioned in EVERY shot of that scene.
  - If a character's role involves a specific environment (e.g., a workshop), that environment's core details (lighting, workbench layout, wall color) MUST be repeated in every scene's "visuals.environment" field to prevent AI hallucination.
  - The script is the SINGLE SOURCE OF TRUTH for the entire production.

13) CAR RESTORATION NICHE SPECIAL RULE:
- Use "Identity Anchor" logic for the car itself (the subject).
- Every scene MUST maintain the same car model, year, and trim.
- The car's state (rusty, stripped, primed, painted) must follow a logical restoration arc across scenes.
- Include the car in "visuals.subject" and "characters_in_scene" as a persistent entity.

14) MONKEY VILLAGE COOKING NICHE SPECIAL RULE:
- Use "Identity Anchor" logic for MULTIPLE monkey characters (e.g., Lead Chef Monkey, Assistant Monkey).
- Every scene MUST maintain the same monkeys with identical fur patterns and accessories.
- Environment: High-detail jungle bamboo kitchen.
- Focus on ASMR sounds and physical coordination between the monkeys.

15) ANIMAL VILLAGE COOKING NICHE SPECIAL RULE:
- Use "Identity Anchor" logic for MULTIPLE animal characters (e.g., Chef Fox, Baker Rabbit).
- Maintain absolute consistency in their cute, stylized features and clothing.
- Vibe: Cozy, wholesome, and magical storytelling.

    16) HISTORICAL MYSTERY NICHE SPECIAL RULE:
    - Use "Identity Anchor" logic for the protagonist and key historical artifacts.
    - Style: "Suspense Mode" with dark, cinematic lighting and gradual reveal logic.
      - Atmosphere: Tense, mysterious, and historically accurate in textures and setting.
      - ADVANCED SUSPENSE: 1) Audio Tension (ASMR): Heavy breathing, mechanical clicks of locks, echoing footsteps. 2) Hidden Visuals: Fleeting shadows in the peripheral frame, reflections of unseen entities in dusty mirrors/glass. 3) Micro-expressions: Extreme close-ups on sweating temples, dilating pupils, or trembling hands. 4) Pacing: Use rhythmic "Heartbeat" cutting during danger and "Time-stop" slow-motion for critical discoveries.
      - EMOTIONAL DEPTH: 1) Nostalgic Framing: Soft focus or golden lighting for artifacts linked to a character's past (grief, longing). 2) Internal Conflict: Capture vulnerability through subtle facial ticks and lingering shots on expressive eyes during difficult choices. 3) Environmental Patina: The environment must reflect the character's internal state (e.g., crumbling ruins representing fading hope). 4) Emotional Score: Use haunting cello or distant, distorted piano to evoke deep sadness or frantic desperation.

    
      17) MAYAJAL STYLE NICHE SPECIAL RULE:
    - Language Support: High-engagement English narration is the primary focus.
    - Narration Style: Mysterious, suspenseful, and dramatic (Documentary-style voiceover).
    - Storytelling Hook: Every script MUST start with a shocking or curious question (e.g., "Did you know?" or "This discovery will leave you speechless").
    - Visuals: Dark, cinematic, high-contrast lighting with fast-paced camera changes.
    - Keywords: Use mystery-inducing words like "mystery", "impossible", "unbelievable", "secret details".


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DESCRIPTION FORMAT (MANDATORY - FOLLOW EXACTLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The "description" field MUST follow this exact structure:

SCENE [SCENE NUMBER]
DURATION: 8s
VISUAL STYLE: [STYLE]
LIGHTING: [LIGHTING]

[DESCRIPTION]

✍️ CAMERA DIRECTION (MUST FOLLOW THESE SHOT CHANGES):
───────────────
• (0s → 3s) [SHOT 1]: Unique camera movement, specific lens (e.g. 35mm, 85mm), exact lighting, micro-actions.
• (3s → 6s) [SHOT 2]: Unique camera movement, specific lens, exact lighting, micro-actions.
• (6s → 8s) [SHOT 3]: Unique camera movement, specific lens, exact lighting, micro-actions.
──────────────
[A highly detailed narrative paragraph describing the visual story, atmosphere, and character performance. Focus on sensory details: smells, sounds, textures, and the emotional weight of the moment.]

Ultra-realistic CGI: High-quality video rendering with professional production values.

STRICTLY FORBIDDEN: cartoon exaggeration, anime, game look, human dialogue, direct eye contact, camera awareness, breaking the fourth wall.
Transition into next scene: Motion continues seamlessly using match-cut, motion bridge, and audio bridge.

[CAMERA BEHAVIOR]
[Shot 1: 0-8s | CINEMATIC] Cinematic slow-motion tracking shot.

[NARRATION / VOICE OVER]
[Spoken narration text for this scene]

[AUDIO MIX]
Ambience: [Ambiance details]
SFX: [SFX details or N/A]
Narration (En): [Spoken narration text]
Music: [Music details or N/A]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ RENDERING STYLE FIELD (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The "rendering_style" field MUST be:
"Ultra-realistic CGI: High-quality video rendering with professional production values"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ABSOLUTE FORMAT RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Output ONLY JSON.
- No on-screen subtitles/text.
- Every scene MUST follow the MANDATORY JSON STRUCTURE exactly.
- Every scene object MUST include all 14+ fields as defined in the schema.
`;

const SCENE_SCHEMA_GUIDE = `
OUTPUT FORMAT (STRICT): Return ONE JSON object with this shape:
{
  "scenes": [
    {
      "scene_number": 1,
      "scene_id": "scene-1",
      "duration": "8s",
      "description": "1-2 short sentences describing what happens (no fancy formatting)",
      "rendering_style": "Ultra-realistic CGI: High-quality video rendering with professional production values",
      "visual_style": "string",
      "cinematography_style": "string",
      "visuals": {
        "subject": "string",
        "environment": "string",
        "lighting_style": "string",
        "color_palette": "string",
        "overall_aesthetic": "string"
      },
      "characters_in_scene": [
        {
          "name": "string",
          "identity_anchor_prompt": "string",
          "current_action": "string",
          "visual_details": "string"
        }
      ],
      "visual_states": [],
      "camera": "string",
      "audio_mix": {
        "ambience_track": { "primary_ambience": "string", "volume_level": "0.2" },
        "sfx_cues": ["string"],
        "audio_content_in_English": "Short narration for this scene"
      }
    }
  ]
}
RULES:
- Output ONLY valid JSON (no markdown, no commentary)
- No trailing commas
- Keep text short to avoid truncation
- Scenes must be sequential and exactly 8 seconds each
`;

const BASE_SCHEMA = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY JSON STRUCTURE (MUST FOLLOW EXACTLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    "scenes": [
      {
        "scene_number": "",
        "scene_id": "",
        "dialogue_summary": "",
        "duration": "8s",
        "description": "SCENE [NUMBER]\nDURATION: 8s\nVISUAL STYLE: [STYLE]\nLIGHTING: [LIGHTING]\n\n[DESCRIPTION]\n\n✍️ CAMERA DIRECTION (MUST FOLLOW THESE SHOT CHANGES):\n───────────────\n• (0s → 3s) [SHOT 1]: Detail...\n• (3s → 6s) [SHOT 2]: Detail...\n• (6s → 8s) [SHOT 3]: Detail...\n──────────────\n[Detailed Paragraph describing visuals, atmosphere, and character flow]\n\nUltra-realistic CGI: High-quality video rendering with professional production values.\n\nSTRICTLY FORBIDDEN: cartoon exaggeration, anime, game look, human dialogue, direct eye contact, camera awareness, breaking the fourth wall.\nTransition into next scene: Motion continues seamlessly using match-cut, motion bridge, and audio bridge.\n\n[CAMERA BEHAVIOR]\n[Shot 1: 0-8s | CINEMATIC] Cinematic slow-motion tracking shot.\n\n[NARRATION / VOICE OVER]\n[Spoken narration text]\n\n[AUDIO MIX]\nAmbience: [Details]\nSFX: [Details]\nNarration (En): [Text]\nMusic: [Details]",
        "rendering_style": "Ultra-realistic CGI: High-quality video rendering with professional production values",

      "visual_style": "",
      "cinematography_style": "",
      "visuals": {
        "subject": "",
        "environment": "",
        "lighting_style": "",
        "color_palette": "",
        "overall_aesthetic": ""
      },
        "niche_optimization": {},
        "characters_in_scene": [
          {
            "name": "Full name of character",
            "identity_anchor_prompt": "CRITICAL: Permanent visual description (e.g. 'A 30-year-old man with sharp jawline, wearing a charcoal grey tactical suit...')",
            "current_action": "What the character is doing in this specific scene",
            "visual_details": "Micro-details for this scene only"
          }
        ],
        "visual_states": [],

      "camera": "",
      "audio_mix": {
        "ambience_track": {
          "primary_ambience": "",
          "volume_level": ""
        },
        "sfx_cues": [],
        "audio_content_in_English": "Engaging background narration that tells the story for this scene."
      }
    }
  ],
  "title": "",
  "synopsis": "",
  "hook": "",
  "cta": "",
  "hashtags": []
}
`;

function buildSystemPromptFull(niche: string, config: any, numScenes: number, subNiche?: string) {
  const nichePrompt = config?.nichePromptOverride || getNichePrompt(niche);
  const nicheMetadata = getNicheMetadata(niche);

  const style = String(config?.style || 'cinematic');
  const voiceEnabled = config?.voiceEnabled !== false;

  // Global: the user-selected Script Tone MUST be reflected in the output
  const toneBlock = `
**SCRIPT TONE LOCK (GLOBAL, MUST FOLLOW):**
- Selected Script Tone: ${style}
- You MUST keep this tone consistent across ALL scenes.
- Do not drift into another style.
`;

  const voiceRules = voiceEnabled
    ? `Voice Over: ENABLED.
- You MUST write narration text consistent with the selected tone.
- Put narration in scene.narration_text AND also in scene.audio_mix.audio_content_in_English.
- Keep narration concise (<= 30 words per scene).
`
    : `Voice Over: DISABLED.
- NO spoken narration or dialogue.
- Do NOT include narration_text.
- In audio_mix.audio_content_in_English, write ambience/SFX ONLY (no speech), e.g. "Ambient audio only: wind, distant traffic, frantic paw steps; no speech.".
`;

  return `
${GLOBAL_MASTER_RULE_PROMPT}

${nichePrompt}

**NICHE METADATA:**
- Selected Niche: ${nicheMetadata.name}
- Expected Complexity: ${nicheMetadata.complexity}
- Key Features: ${nicheMetadata.keyFeatures.join(', ')}

${toneBlock}

Niche: ${niche} ${subNiche ? `(Sub-Category: ${subNiche})` : ''}
Total Scenes in this video: ${numScenes}
Language: ${config.language || 'English'}.
${voiceRules}
Rendering Style: "Ultra-realistic CGI".

${SCENE_SCHEMA_GUIDE}
`;
}

function buildSystemPromptLite(niche: string, config: any, numScenes: number, subNiche?: string) {
  const nichePrompt = config?.nichePromptOverride || getNichePrompt(niche);
  const style = String(config?.style || 'cinematic');
  const voiceEnabled = config?.voiceEnabled !== false;

  const toneBlock = `
**SCRIPT TONE LOCK (GLOBAL, MUST FOLLOW):**
- Selected Script Tone: ${style}
- Keep this tone consistent across ALL scenes.
`;

  const voiceRules = voiceEnabled
    ? `Voice Over: ENABLED. Keep narration concise and consistent with the selected tone.`
    : `Voice Over: DISABLED. No speech; audio_mix.audio_content_in_English must be ambience/SFX only.`;

  return `
${GLOBAL_MASTER_RULE_PROMPT}

${nichePrompt}

${toneBlock}

Niche: ${niche} ${subNiche ? `(Sub-Category: ${subNiche})` : ''}
Total Scenes in this video: ${numScenes}
${voiceRules}

${SCENE_SCHEMA_GUIDE}
`;
}

function ensureShotsAndTransitions(
  scene: any,
  sceneNumber: number,
  niche?: string,
  subjectName?: string,
  subNiche?: string,
  options?: { voiceEnabled?: boolean; style?: string }
): any {
  try {
    // Initialize mandatory fields first to prevent undefined errors
    if (!scene.audio_mix) {
      scene.audio_mix = {
        ambience_track: { primary_ambience: "", volume_level: "" },
        sfx_cues: [],
        audio_content_in_English: ""
      };
    }
    
    if (!scene.visuals) {
      scene.visuals = {
        subject: "",
        environment: "",
        lighting_style: "",
        color_palette: "",
        overall_aesthetic: ""
      };
    }
    
    if (!scene.characters_in_scene) {
      scene.characters_in_scene = [];
    }
    
    if (!scene.visual_states) {
      scene.visual_states = [];
    }
    
    if (!scene.niche_optimization) {
      scene.niche_optimization = {};
    }

    // ... standardizations ...
    if (scene.sceneNumber && !scene.scene_number) scene.scene_number = scene.sceneNumber;
    if (scene.sceneId && !scene.scene_id) scene.scene_id = scene.sceneId;
    if (scene.renderingStyle && !scene.rendering_style) scene.rendering_style = scene.renderingStyle;
    if (scene.visualStyle && !scene.visual_style) scene.visual_style = scene.visualStyle;
    if (scene.audioMix && !scene.audio_mix) scene.audio_mix = scene.audioMix;
    if (scene.voiceOver && !scene.voice_over) scene.voice_over = scene.voiceOver;
    if (scene.narrationText && !scene.narration_text) scene.narration_text = scene.narrationText;

    // ... recovery ...
    if (!scene.narration_text && scene.voice_over?.text) scene.narration_text = scene.voice_over.text;
    if (!scene.narration_text && scene.audio_mix?.audio_content_in_English) scene.narration_text = scene.audio_mix.audio_content_in_English;
    
    // CRITICAL: Ensure consistent scene numbering
    scene.scene_number = sceneNumber;
    scene.scene_id = `scene-${sceneNumber}`;
    scene.duration = "8s";

    // GLOBAL: enforce Script Tone / Voice setting at post-processing time
    const voiceEnabled = options?.voiceEnabled !== false;
    const style = String(options?.style || 'cinematic');

    // If voice is disabled, strip any narration fields and keep audio as ambience-only.
    if (!voiceEnabled) {
      if (scene.narration_text) delete scene.narration_text;
      if (scene.voice_over) delete scene.voice_over;

      const audioText = String(scene.audio_mix?.audio_content_in_English || '').trim();
      // Replace any accidental narration-like content with an ambience-only line.
      if (!audioText || /\b(narration|voiceover|says|he says|she says|they say)\b/i.test(audioText)) {
        scene.audio_mix.audio_content_in_English = 'Ambient audio only: wind/room tone, distant environment, footsteps, cloth rustle, breathing; no speech.';
      } else if (!/no speech/i.test(audioText)) {
        // Make the constraint explicit
        scene.audio_mix.audio_content_in_English = `${audioText} (no speech)`;
      }

      // Also avoid leaving dialogue_summary populated with dialogue-like text
      if (typeof scene.dialogue_summary === 'string' && scene.dialogue_summary.trim()) {
        scene.dialogue_summary = 'Visual-only (no dialogue).';
      }
    } else {
      // Voice is enabled: ensure narration_text exists and matches audio_content.
      const a = String(scene.audio_mix?.audio_content_in_English || '').trim();
      if (!scene.narration_text && a) scene.narration_text = a;
    }

    // Carry the selected tone into niche_optimization for debugging/traceability (non-breaking)
    scene.niche_optimization = scene.niche_optimization || {};
    scene.niche_optimization.script_tone = style;
    scene.niche_optimization.voice_enabled = voiceEnabled;

      // Car Restoration Niche Specific Patching
      if (niche === 'car-restoration' && subjectName) {
        if (!scene.visuals) scene.visuals = { subject: subjectName, environment: "", lighting_style: "", color_palette: "", overall_aesthetic: "" };
        
        const lowerSubject = (scene.visuals.subject || "").toLowerCase();
        const lowerCar = subjectName.toLowerCase();
        
        if (!lowerSubject.includes(lowerCar)) {
          scene.visuals.subject = `${subjectName} (${scene.visual_details || 'Restoration subject'}), ${scene.visuals.subject || ""}`.trim();
        }

        // Add car to characters_in_scene if not present or ensuring it's the anchor
        if (!scene.characters_in_scene) scene.characters_in_scene = [];
        const hasCar = scene.characters_in_scene.some((c: any) => c.name.toLowerCase().includes(lowerCar));
        if (!hasCar) {
          scene.characters_in_scene.push({
            name: subjectName,
            identity_anchor_prompt: `A classic ${subjectName} in a specific state of restoration, maintained with absolute consistency across all scenes (Visual Anchor).`,
            current_action: "Being restored in the workshop.",
            visual_details: scene.visual_details || "Original textures and metallic surfaces."
          });
        }
      }

        // Monkey Village Cooking Niche Specific Patching (Multiple Characters)
        if (niche === 'monkey-village-cooking') {
          if (!scene.characters_in_scene || !Array.isArray(scene.characters_in_scene) || scene.characters_in_scene.length < 2) {
            const currentChars = Array.isArray(scene.characters_in_scene) ? scene.characters_in_scene : [];
            if (currentChars.length === 0) {
              scene.characters_in_scene = [
                {
                  name: "Lead Chef Monkey",
                  identity_anchor_prompt: "A chimpanzee chef with a focused face (sharp features, deep-set eyes), body color of dark mahogany fur, and a lean, muscular body shape. Consistent fur patterns and facial structure.",
                  current_action: "Managing the cooking process in the bamboo kitchen.",
                  visual_details: "Detailed fur textures, realistic simian movements."
                },
                {
                  name: "Assistant Monkey",
                  identity_anchor_prompt: "A smaller capuchin monkey with a playful face (large expressive eyes, flat nose), body color of light sandy-brown fur, and a petite, agile body shape. Wearing a green bandana.",
                  current_action: "Assisting with ingredients and fire management.",
                  visual_details: "Active movements, interacting with environment."
                }
              ];
            } else if (currentChars.length === 1) {
              scene.characters_in_scene.push({
                name: "Assistant Monkey",
                identity_anchor_prompt: "A smaller capuchin monkey with a playful face (large expressive eyes, flat nose), body color of light sandy-brown fur, and a petite, agile body shape. Wearing a green bandana.",
                current_action: "Assisting with ingredients and fire management.",
                visual_details: "Active movements, interacting with environment."
              });
            }
          }
        }

        // Animal Village Cooking Niche Specific Patching (Multiple Characters)
        if (niche === 'animal-village-cooking') {
          if (!scene.characters_in_scene || !Array.isArray(scene.characters_in_scene) || scene.characters_in_scene.length < 2) {
            const currentChars = Array.isArray(scene.characters_in_scene) ? scene.characters_in_scene : [];
            if (currentChars.length === 0) {
              scene.characters_in_scene = [
                {
                  name: "Chef Fox",
                  identity_anchor_prompt: "A sophisticated fox with a sharp, elegant face (pointed muzzle, intelligent amber eyes), body color of vibrant orange and white fur, and a slender, upright body shape. Wearing a tiny baker's hat.",
                  current_action: "Artfully preparing ingredients.",
                  visual_details: "Soft fur lighting, delicate paw coordination."
                },
                {
                  name: "Baker Rabbit",
                  identity_anchor_prompt: "A cute white rabbit with a soft, round face (large twitching nose, dark eyes), body color of pure snow-white fluffy fur, and a small, plump body shape. Wearing a floral vest.",
                  current_action: "Handling baking tasks.",
                  visual_details: "Sub-surface scattering on ears, whimsical movement."
                }
              ];
            } else if (currentChars.length === 1) {
              scene.characters_in_scene.push({
                name: "Baker Rabbit",
                identity_anchor_prompt: "A cute white rabbit with a soft, round face (large twitching nose, dark eyes), body color of pure snow-white fluffy fur, and a small, plump body shape. Wearing a floral vest.",
                current_action: "Handling baking tasks.",
                visual_details: "Sub-surface scattering on ears, whimsical movement."
              });
            }
}
}

// Historical Mystery Niche Specific Patching
if (niche === 'historical-facts') {
  if (!scene.characters_in_scene || !Array.isArray(scene.characters_in_scene) || scene.characters_in_scene.length === 0) {
    scene.characters_in_scene = [
      {
        name: "The Investigator",
        identity_anchor_prompt: "A middle-aged historian with sharp, observant eyes, wearing a vintage trench coat and a felt fedora. Consistent facial features and a lean, slightly hunched posture.",
        current_action: "Investigating the historical clues.",
        visual_details: "Detailed fabric textures, expressive facial shadows."
      }
    ];
  }

  // Ensure audio_mix exists before accessing its properties
  if (!scene.audio_mix) {
    scene.audio_mix = {
      ambience_track: { primary_ambience: "", volume_level: "" },
      sfx_cues: [],
      audio_content_in_English: ""
    };
  }

  // Inject Advanced Suspense SFX if missing
  if (!scene.audio_mix.sfx_cues || scene.audio_mix.sfx_cues.length === 0) {
    scene.audio_mix.sfx_cues = ["Heavy rhythmic breathing", "Mechanical clicking of ancient mechanisms", "Echoing footsteps on stone", "Low-frequency subsonic drone"];
  }

  // Inject Emotional Depth cues if missing
  if (!scene.audio_mix.music || scene.audio_mix.music === "N/A" || scene.audio_mix.music === "") {
    scene.audio_mix.music = "Haunting cello melody mixed with distant, distorted piano notes to evoke deep historical sorrow and high-stakes urgency.";
  }
  
  if (scene.visuals && !scene.visuals.overall_aesthetic?.toLowerCase().includes('emotional')) {
    scene.visuals.overall_aesthetic = `Emotional Cinematic Mystery, highlighting the protagonist's internal struggle and the weight of history, ${scene.visuals.overall_aesthetic || ''}`;
  }


  // Sub-niche specific adjustments
  if (subNiche === 'ancient-secrets') {
    scene.visual_style = `Ancient, Mystical, Archaeological, ${scene.visual_style || ''}`;
    if (scene.visuals) scene.visuals.lighting_style = `Ethereal and soft ancient lighting, ${scene.visuals.lighting_style || ''}`;
  } else if (subNiche === 'lost-treasures') {
    scene.visual_style = `Adventure, Golden Hour, Epic, ${scene.visual_style || ''}`;
    if (scene.visuals) scene.visuals.color_palette = `Gold, Amber, Deep Greens, ${scene.visuals.color_palette || ''}`;
  } else if (subNiche === 'dark-history') {
    scene.visual_style = `Noir, Grim, Gritty Realism, ${scene.visual_style || ''}`;
    if (scene.visuals) scene.visuals.lighting_style = `Extreme low-key noir lighting, ${scene.visuals.lighting_style || ''}`;
  } else if (subNiche === 'mayajal-style') {
    // Force Mysterious Bengali Narration logic
    if (scene.visuals) {
      if (!scene.visuals.lighting_style?.toLowerCase().includes('chiaroscuro')) {
        scene.visuals.lighting_style = `Intense Chiaroscuro lighting, deep shadows, high-contrast mystery, ${scene.visuals.lighting_style || ''}`;
      }
      if (!scene.visuals.overall_aesthetic?.toLowerCase().includes('mayajal')) {
        scene.visuals.overall_aesthetic = `Mayajal-style cinematic mystery, high engagement visuals, ${scene.visuals.overall_aesthetic || ''}`;
      }
    }
    // Ensure high-impact camera angles
    if (scene.camera && !scene.camera.includes('DUTCH-ANGLE')) {
      scene.camera = `[Shot 1: 0-8s | SUSPENSE] Fast-paced Dutch-angle tracking shot with cinematic zoom.`;
    }
  }

  // Ensure dark/mysterious lighting for all historical-facts if not specified
  if (scene.visuals) {
    if (!scene.visuals.lighting_style?.toLowerCase().includes('dark') && !scene.visuals.lighting_style?.toLowerCase().includes('mysterious') && !subNiche) {
      scene.visuals.lighting_style = `Mysterious and low-key lighting, ${scene.visuals.lighting_style || ''}`;
    }
  }
}

// Legacy patching for mayajal-style as a standalone niche (for backward compatibility if needed)
if (niche === 'mayajal-style') {
  if (!scene.visuals) scene.visuals = { subject: "", environment: "", lighting_style: "", color_palette: "", overall_aesthetic: "" };
  
  // Force Mysterious Bengali Narration logic
  if (!scene.visuals.lighting_style?.toLowerCase().includes('chiaroscuro')) {
    scene.visuals.lighting_style = `Intense Chiaroscuro lighting, deep shadows, high-contrast mystery, ${scene.visuals.lighting_style || ''}`;
  }
  
  if (!scene.visuals.overall_aesthetic?.toLowerCase().includes('mayajal')) {
    scene.visuals.overall_aesthetic = `Mayajal-style cinematic mystery, high engagement visuals, ${scene.visuals.overall_aesthetic || ''}`;
  }

  // Ensure high-impact camera angles
  if (scene.camera && !scene.camera.includes('DUTCH-ANGLE')) {
    scene.camera = `[Shot 1: 0-8s | SUSPENSE] Fast-paced Dutch-angle tracking shot with cinematic zoom.`;
  }
}


// Ensure all 14+ Mandatory Fields exist with fallback values

    if (!scene.dialogue_summary) scene.dialogue_summary = "";
    if (!scene.rendering_style || !scene.rendering_style.includes("Ultra-realistic CGI")) {
      scene.rendering_style = "Ultra-realistic CGI: High-quality video rendering with professional production values";
    }
    if (!scene.visual_style) scene.visual_style = "Cinematic, high-fidelity atmosphere";
    if (!scene.cinematography_style) scene.cinematography_style = "Professional cinematic camera work";
    
    if (!scene.visuals) scene.visuals = { subject: "", environment: "", lighting_style: "", color_palette: "", overall_aesthetic: "" };
    
    // Inject Character identity and role into visuals.subject and description (Consistency Fail-safe)
    if (scene.characters_in_scene && Array.isArray(scene.characters_in_scene) && scene.characters_in_scene.length > 0) {
      const mainChar = scene.characters_in_scene[0];
      const charName = String(mainChar?.name || "Main Character");
      const anchor = String(mainChar?.identity_anchor_prompt || "");
      const role = String(mainChar?.current_role || mainChar?.role || "");
      
      const rolePrefix = role ? `Role: ${role} | ` : "";
      
      // Ensure visuals exists
      if (!scene.visuals) scene.visuals = { subject: "", environment: "", lighting_style: "", color_palette: "", overall_aesthetic: "" };
      
      // If subject is generic or doesn't mention the main character's core traits, inject it
      const subject = String(scene.visuals?.subject || "");
      const lowerSubject = subject.toLowerCase();
      const lowerCharName = charName.toLowerCase();

      if (!subject || subject.length < 20 || !lowerSubject.includes(lowerCharName)) {
        scene.visuals.subject = `${rolePrefix}${charName} (DNA: ${anchor}), ${subject}`.trim();
      } else if (anchor && !subject.includes(anchor)) {
        // Force the anchor and role into the subject if it's missing
        scene.visuals.subject = `${rolePrefix}${subject} (Visual Lock: ${anchor})`.trim();
      }

      // Ensure the description paragraph also mentions the character's appearance and role
      if (scene.description && typeof scene.description === 'string' && !scene.description.includes(anchor) && scene.description.length > 50) {
        // We add it to the end of the visual paragraph or description
        scene.description = scene.description.replace(/Ultra-realistic CGI:/, `Physical Lock & Role: ${rolePrefix}${anchor}\n\nUltra-realistic CGI:`);
      }
    }

    if (!scene.visuals.subject) scene.visuals.subject = "Main character and focal elements";
    if (!scene.visuals.environment) scene.visuals.environment = "Consistent high-detail setting";
    if (!scene.visuals.lighting_style) scene.visuals.lighting_style = "Cinematic studio lighting";
    if (!scene.visuals.color_palette) scene.visuals.color_palette = "Cohesive professional palette";
    if (!scene.visuals.overall_aesthetic) scene.visuals.overall_aesthetic = "Ultra-realistic premium look";

    if (!scene.niche_optimization) scene.niche_optimization = {};
    if (!scene.characters_in_scene || !Array.isArray(scene.characters_in_scene) || scene.characters_in_scene.length === 0) {
      scene.characters_in_scene = [
        {
          name: "Main Character",
          identity_anchor_prompt: "A cinematic main character, consistent in appearance, clothing, and features throughout the video.",
          current_action: "Performing actions consistent with the scene description.",
          visual_details: "Detailed high-fidelity features, consistent attire."
        }
      ];
    }
    if (!scene.visual_states) scene.visual_states = [];
    if (!scene.camera) scene.camera = "[Shot 1: 0-8s | CINEMATIC] Cinematic slow-motion tracking shot.";
    
    if (!scene.audio_mix) scene.audio_mix = { ambience_track: { primary_ambience: "", volume_level: "" }, sfx_cues: [], audio_content_in_English: "" };
    if (!scene.audio_mix.ambience_track) scene.audio_mix.ambience_track = { primary_ambience: "Natural atmospheric hum", volume_level: "0.2" };
    if (!scene.audio_mix.sfx_cues) scene.audio_mix.sfx_cues = [];
    
    // Final alignment of narration
    if (!scene.audio_mix.audio_content_in_English) {
      scene.audio_mix.audio_content_in_English = scene.narration_text || "The story continues with cinematic grace.";
    }

    // Process Description for Camera Direction & Transitions
    if (!scene.description) scene.description = "Visual details for this scene.";

    const hasNewFormat = scene.description.includes("✍️ CAMERA DIRECTION") || scene.description.includes("SCENE ");

    if (!hasNewFormat) {
      const shotVariations = [
        { s1: "[WIDE-SHOT]", s2: "[MEDIUM-SHOT]", s3: "[CLOSE-UP]" },
        { s1: "[LOW-ANGLE]", s2: "[TRACKING-SHOT]", s3: "[MACRO-DETAIL]" },
        { s1: "[BIRD-EYE]", s2: "[D-MOTION]", s3: "[EXTREME-CLOSE-UP]" },
        { s1: "[HOLLYWOOD-DOLLY]", s2: "[PAN-SHOT]", s3: "[TILT-UP]" },
      ];
      const variant = shotVariations[(sceneNumber - 1) % shotVariations.length];
      const cameraDetail = scene.camera || "Cinematic movement showcasing the environment and subject.";
      
      const visualStyle = scene.visual_style || "Cinematic, high-fidelity atmosphere";
      const lighting = scene.visuals?.lighting_style || "Overcast skies with warm and cool lighting";
      const narration = scene.narration_text || scene.audio_mix?.audio_content_in_English || "The story continues with cinematic grace.";
      const ambience = scene.audio_mix?.ambience_track?.primary_ambience || "Natural atmospheric hum";

      scene.description = `SCENE ${sceneNumber}
DURATION: 8s
VISUAL STYLE: ${visualStyle}
LIGHTING: ${lighting}

[DESCRIPTION]

✍️ CAMERA DIRECTION (MUST FOLLOW THESE SHOT CHANGES):
───────────────
• (0s → 3s) ${variant.s1}: ${cameraDetail}
• (3s → 6s) ${variant.s2}: Camera moves with deliberate speed, capturing textures and atmosphere.
• (6s → 8s) ${variant.s3}: Focus on micro-expressions and high-fidelity environmental details.
──────────────
${scene.description}

Ultra-realistic CGI: High-quality video rendering with professional production values.

STRICTLY FORBIDDEN: cartoon exaggeration, anime, game look, human dialogue, direct eye contact, camera awareness, breaking the fourth wall.
Transition into next scene: Motion continues seamlessly using match-cut, motion bridge, and audio bridge.

[CAMERA BEHAVIOR]
${scene.camera || `[Shot 1: 0-8s | CINEMATIC] Cinematic slow-motion tracking shot.`}

[NARRATION / VOICE OVER]
${narration}

[AUDIO MIX]
Ambience: ${ambience}
SFX: ${scene.audio_mix?.sfx_cues?.length > 0 ? scene.audio_mix.sfx_cues.join(", ") : "N/A"}
Narration (En): ${narration}
Music: N/A`;
    }

    return scene;
  } catch (err) {
    console.error(`Patching Scene ${sceneNumber} failed:`, err);
    return scene;
  }
}

function validateScript(data: any, expectedMinScenes: number, isBatch = false): { isValid: boolean; score: number; scenes: any[]; error?: string } {
  try {
    if (!data) return { isValid: false, score: 0, scenes: [], error: "Empty response" };

    let scenes = isBatch ? (Array.isArray(data) ? data : data.scenes) : data.scenes;

    if (!scenes || !Array.isArray(scenes)) {
      return { isValid: false, score: 0, scenes: [], error: "Missing scenes array" };
    }

    const requiredKeys = ['scene_number', 'description', 'visuals', 'audio_mix'];
    let validScenesCount = 0;
    
    const processedScenes = scenes.map((scene, i) => {
      let isSceneValid = true;
      for (const key of requiredKeys) {
        if (scene[key] === undefined) {
          isSceneValid = false;
          break;
        }
      }
      if (isSceneValid) validScenesCount++;
      return scene;
    });

    const score = (validScenesCount / expectedMinScenes) * 100;
    const tolerance = expectedMinScenes > 5 ? 2 : 1;
    
    if (validScenesCount < (expectedMinScenes - tolerance)) {
      return { 
        isValid: false, 
        score, 
        scenes: processedScenes, 
        error: `Scene count mismatch: expected at least ${expectedMinScenes - tolerance}, got ${validScenesCount}` 
      };
    }

    return { isValid: true, score, scenes: processedScenes };
  } catch (err: any) {
    return { isValid: false, score: 0, scenes: [], error: err.message };
  }
}

// Universal AI call function that works with any LLM provider
async function callLLMProvider(
  provider: string,
  apiKey: string,
  config: ProviderConfig,
  messages: any[],
  model?: string
): Promise<any> {
  // Use provider-specific default models instead of the passed model
  // This prevents issues where frontend sends gemini model names to other providers
  let selectedModel: string;
  
  switch (provider) {
    case 'cerebras':
      selectedModel = 'llama3.1-8b'; // Use the 8B model instead of 70B
      break;
    case 'xai':
      selectedModel = 'grok-2-latest'; // Use the latest model instead of deprecated one
      break;
    case 'deepseek':
      selectedModel = 'deepseek-chat';
      break;
    case 'github':
      selectedModel = 'gpt-4o-mini'; // Try a simpler model
      break;
    case 'groq':
      selectedModel = 'llama-3.3-70b-versatile';
      break;
    case 'openai':
      selectedModel = 'gpt-4o';
      break;
    case 'openrouter':
      selectedModel = 'openai/gpt-4o-mini'; // Use a simpler, more available model
      break;
    case 'mistral':
      selectedModel = 'mistral-large-latest'; // Use Mistral's latest model
      break;
    case 'gemini':
      selectedModel = model || 'gemini-1.5-flash-latest';
      break;
    default:
      selectedModel = model || config.models[0];
  }
  
  switch (provider) {
    case 'openai':
    case 'groq':
    case 'deepseek':
    case 'cerebras':
    case 'xai':
    case 'github':
    case 'openrouter':
    case 'mistral':
      return await callOpenAICompatible(provider, apiKey, config.baseUrl, messages, selectedModel);
    
    case 'gemini':
      return await callGemini(apiKey, messages, selectedModel);
    
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// OpenAI-compatible API call
async function callOpenAICompatible(
  provider: string,
  apiKey: string,
  baseUrl: string,
  messages: any[],
  model: string
): Promise<any> {
  // Token limits: keep smaller to reduce truncation (we want strict JSON)
  let maxTokens = 1800;
  if (provider === 'github') maxTokens = 2200;
  if (provider === 'groq') maxTokens = 1800;
  if (provider === 'openai') maxTokens = 1800;
  // OpenRouter sometimes rejects requests when account credits are low.
  // Keep max_tokens conservative to avoid 402 "can only afford" errors.
  if (provider === 'openrouter') maxTokens = 900;
  if (provider === 'mistral') maxTokens = 1800;
  if (provider === 'deepseek') maxTokens = 1800;
  
  // Prepare headers with provider-specific requirements
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  
  // Add OpenRouter specific headers
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://toolkit-hub.vercel.app';
    headers['X-Title'] = 'AI Toolkit Hub';
  }
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.4,
      // Ask for strict JSON when the provider supports it.
      ...((provider === 'groq' || provider === 'openai' || provider === 'openrouter' || provider === 'mistral' || provider === 'deepseek')
        ? { response_format: { type: 'json_object' } }
        : {})
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    // OpenRouter: if account credits are low, it returns 402 with the affordable max_tokens.
    // Example: "You requested up to 900 tokens, but can only afford 858"
    if (provider === 'openrouter' && response.status === 402) {
      const m = errorText.match(/can only afford\s+(\d+)\b/i);
      const affordable = m ? parseInt(m[1], 10) : NaN;

      if (Number.isFinite(affordable) && affordable > 50 && affordable < maxTokens) {
        const retryMax = Math.max(50, affordable - 25);
        console.warn(`[OpenRouter] 402: retrying with lower max_tokens=${retryMax} (was ${maxTokens})`);

        const retryRes = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            messages,
            max_tokens: retryMax,
            temperature: 0.4,
            ...(['groq', 'openai', 'openrouter', 'mistral', 'deepseek'].includes(provider)
              ? { response_format: { type: 'json_object' } }
              : {})
          }),
        });

        if (!retryRes.ok) {
          const retryText = await retryRes.text();
          throw new Error(`${provider} API error: ${retryRes.status} - ${retryText}`);
        }

        return await retryRes.json();
      }
    }

    throw new Error(`${provider} API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Gemini API call
async function callGemini(
  apiKey: string,
  messages: any[],
  model: string
): Promise<any> {
  const userMessage = messages.find(m => m.role === 'user')?.content || '';
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const prompt = systemMessage ? `${systemMessage}\n\n${userMessage}` : userMessage;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: 6000, // Reduced for better completion
        temperature: 0.7,
        responseMimeType: 'application/json'
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  return {
    choices: [{
      message: { content }
    }]
  };
}

export const POST = async (request: NextRequest) => {
  const tool = 'faceless-script';
  try {
    const body = await request.json();

    // IMPORTANT: the UI generates the full script in multiple batches (Scene 1..N).
    // Charge credits only ONCE per full script generation.
    // We dedupe using generationId (recommended) and fall back to startScene heuristic.
    const startSceneRaw = body?.startScene;
    const startScene = typeof startSceneRaw === 'number' ? startSceneRaw : parseInt(String(startSceneRaw ?? '1'), 10);
    const isFirstBatch = !Number.isFinite(startScene) || startScene <= 1;

    const generationId = typeof body?.generationId === 'string' ? body.generationId.trim() : '';

    // Require auth for all batches
    const auth = request.headers.get('authorization');
    if (!auth) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const alreadyCharged = generationId ? await hasChargedGeneration({ req: request, tool, generationId }) : false;
    const shouldCharge = !alreadyCharged && (isFirstBatch || !!generationId);

    if (shouldCharge) {
      const chk = await checkCredits({ req: request, tool });
      if (!chk.ok) {
        return NextResponse.json({ error: chk.error, creditsNeeded: chk.creditsNeeded, remaining: chk.remaining }, { status: chk.status });
      }
    }

    const { 
      topic, niche, language, voiceEnabled,
      videoDuration, aiProvider, aiModel, subjectName,
      shotsPerScene, musicEnabled, subNiche,
      // UI fields
      projectName,
      outputFormat,
      // Optional override from UI
      totalScenes
    } = body;

    if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

    const durationScenes = videoDuration ? getMaxScenesForDuration(parseFloat(videoDuration)) : 8;

    // If user explicitly chooses a scene count, honor it (within safe bounds)
    const requestedScenesRaw = typeof totalScenes === 'number' ? totalScenes : parseInt(String(totalScenes || ''), 10);
    const requestedScenes = Number.isFinite(requestedScenesRaw) ? requestedScenesRaw : NaN;

    const numScenes = Number.isFinite(requestedScenes)
      ? Math.min(Math.max(requestedScenes, 1), 113)
      : durationScenes;

    const languageMap: Record<string, string> = {
      en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French',
      de: 'German', ar: 'Arabic', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
    };

    const config = {
      style: body?.style || 'cinematic',
      voiceEnabled: voiceEnabled !== false,
      musicEnabled: musicEnabled !== false,
      language: languageMap[language] || 'English',
      shotsPerScene
    };

    const jsonGuard = `
CRITICAL JSON REQUIREMENTS:
- Return ONLY valid JSON
- No markdown code blocks or backticks
- No text before or after JSON
- Keep descriptions CONCISE (max 100 words per scene)
- Ensure all strings are properly escaped
- Strings must be valid JSON strings (escape quotes properly)
- Keep descriptions short (1-2 sentences) to avoid truncation
- Close all brackets and braces
- The response must be a complete, valid JSON object
- PRIORITIZE COMPLETENESS over excessive detail
- Use shorter camera descriptions (max 20 words each)
- Keep narration under 30 words per scene
- Avoid special characters like quotes, backslashes, or control characters in text
- Use plain text only - no formatting symbols
`;

    const systemPromptFull = buildSystemPromptFull(niche, config, numScenes, subNiche);
    const firstBatchScenes = Math.min(numScenes, 1); // Most stable: generate 1 scene per batch to avoid truncation
    const firstBatchMessages = [
      { role: 'system' as const, content: `${systemPromptFull}${jsonGuard}` },
      {
        role: 'user' as const,
        content: `Generate scenes 1 to ${firstBatchScenes} (exactly ${firstBatchScenes} scenes) for topic: "${topic}".
Subject: ${subjectName || 'Main character'}.

STRICT REQUIREMENTS:
- Return ONE valid JSON object only.
- scenes must be an array of exactly ${firstBatchScenes} scene objects.
- Keep description + camera + narration SHORT.
- Scene numbering must start at 1 and increment by 1.
`
      }
    ];

    // Generate first batch using Universal AI Manager
    const firstBatchResult = await generateWithTextAI(
      async (provider, apiKey, config) => {
        return await callLLMProvider(provider, apiKey, config, firstBatchMessages, aiModel);
      },
      aiProvider as TextGenProvider
    );

    if (!firstBatchResult.success) {
      console.error('First batch generation failed:', {
        error: firstBatchResult.error,
        providersAttempted: firstBatchResult.providersAttempted,
        totalAttempts: firstBatchResult.totalAttempts
      });
      throw new Error(firstBatchResult.error || 'Failed to generate first batch');
    }

    let baseScript = parseAIJsonSafe(firstBatchResult.data!.choices[0].message.content);
    
    // Handle different response formats
    if (Array.isArray(baseScript)) {
      // If it's an array, wrap it in the expected structure
      baseScript = { 
        scenes: baseScript, 
        title: topic, 
        synopsis: topic, 
        hook: "", 
        cta: "", 
        hashtags: [] 
      };
    } else if (!baseScript.scenes && typeof baseScript === 'object') {
      // If it's an object but scenes is missing, try to find scenes
      const possibleScenes = baseScript.scenes || baseScript.data || Object.values(baseScript).find(v => Array.isArray(v));
      baseScript = { 
        ...baseScript, 
        scenes: Array.isArray(possibleScenes) ? possibleScenes : [],
        title: baseScript.title || topic,
        synopsis: baseScript.synopsis || topic,
        hook: baseScript.hook || "",
        cta: baseScript.cta || "",
        hashtags: baseScript.hashtags || []
      };
    }

    // Ensure scenes is always an array
    if (!Array.isArray(baseScript.scenes)) {
      baseScript.scenes = [];
    }

    baseScript.scenes = (baseScript.scenes || []).map((s: any, i: number) =>
      ensureShotsAndTransitions(s, i + 1, niche, subjectName, subNiche, { voiceEnabled: config.voiceEnabled, style: config.style })
    );

    if (numScenes > firstBatchScenes) {
      const systemPromptLite = buildSystemPromptLite(niche, config, numScenes, subNiche);
      
      for (let start = firstBatchScenes + 1; start <= numScenes; start += 1) {
        const end = start;
        const expectedCount = 1;
        await delay(300); // Reduced delay for faster failover recovery
        
        const lastScene = baseScript.scenes && baseScript.scenes.length > 0 
          ? baseScript.scenes[baseScript.scenes.length - 1] 
          : null;
        
        if (!lastScene) {
          console.warn("Base script scenes missing for batch generation. Retrying first batch pattern.");
          continue;
        }
        
        const mainCharacterBlueprints = baseScript.scenes[0]?.characters_in_scene || [];
        
        const continuityAnchor = {
          title: baseScript.title,
          synopsis: baseScript.synopsis,
          mainSubject: subjectName || "",
          lastSceneSummary: lastScene.description || "",
          lastSceneNumber: lastScene.scene_number,
          currentCameraStyle: lastScene.camera || lastScene.cinematography_style || "Standard Cinematic",
          environmentLock: lastScene.visuals?.environment || "Same as previous",
          characterBlueprints: mainCharacterBlueprints,
          physicalLock: mainCharacterBlueprints.map((c: any) => c.identity_anchor_prompt).join(" | "),
          roleLock: mainCharacterBlueprints.map((c: any) => ({ name: c.name, role: c.current_role || "Establish persistent role" }))
        };

        const batchMessages = [
          { role: 'system' as const, content: `${systemPromptLite}${jsonGuard}` },
          {
            role: 'user' as const,
            content: `Generate scenes ${start} to ${end} (exactly ${expectedCount} scenes) continuing the same story.

STRICT REQUIREMENTS:
- Return ONE valid JSON object only with key "scenes".
- scenes must be an array of exactly ${expectedCount} scene objects.
- Scene numbering must start at ${start} and increment by 1.
- Keep description + camera + narration SHORT.
- Maintain continuity with previous scenes.

Previous Scene Context (for continuity only):
${JSON.stringify(continuityAnchor, null, 2)}
`
          }
        ];

        // Generate batch using Universal AI Manager
        const batchResult = await generateWithTextAI(
          async (provider, apiKey, config) => {
            return await callLLMProvider(provider, apiKey, config, batchMessages, aiModel);
          },
          aiProvider as TextGenProvider
        );

        if (!batchResult.success) {
          console.warn(`Batch ${start}-${end} failed: ${batchResult.error}`);
          continue;
        }

        const batchData = parseAIJsonSafe(batchResult.data!.choices[0].message.content);
        let newScenes = Array.isArray(batchData) ? batchData : (batchData as any)?.scenes || [];
        
        newScenes = newScenes.map((s: any, i: number) =>
          ensureShotsAndTransitions(s, start + i, niche, subjectName, subNiche, { voiceEnabled: config.voiceEnabled, style: config.style })
        );
        baseScript.scenes.push(...newScenes);
      }
    }

    // Final scene numbering validation and fix
    baseScript.scenes = baseScript.scenes.map((scene: any, index: number) => {
      const correctSceneNumber = index + 1;
      scene.scene_number = correctSceneNumber;
      scene.scene_id = `scene-${correctSceneNumber}`;

      // Update scene number in description if it exists
      if (scene.description && typeof scene.description === 'string') {
        scene.description = scene.description.replace(/^SCENE \d+/, `SCENE ${correctSceneNumber}`);
      }

      return scene;
    });

    // Ensure top-level script fields exist (UI expects these)
    const firstScene = baseScript.scenes?.[0];
    const lastScene = baseScript.scenes?.[baseScript.scenes.length - 1];

    baseScript.title = String(baseScript.title || projectName || topic || 'Generated Script');

    // Hook: short, punchy, derived from projectName/topic/scene 1 if missing
    if (!baseScript.hook || !String(baseScript.hook).trim()) {
      const hint = (projectName || firstScene?.visuals?.subject || firstScene?.description || topic || '').toString();
      baseScript.hook = hint ? hint.slice(0, 140).trim() : String(topic || '').slice(0, 140).trim();
    }

    // Synopsis: 1–2 lines summary; derived from topic + progression if missing
    if (!baseScript.synopsis || !String(baseScript.synopsis).trim()) {
      const a = (firstScene?.visuals?.environment || '').toString();
      const b = (lastScene?.visuals?.environment || '').toString();
      const core = String(projectName || topic || baseScript.title || '').trim();
      const env = [a, b].filter(Boolean).slice(0, 2).join(' → ');
      baseScript.synopsis = env ? `${core} (${env})` : core;
    }

    // CTA: derived from ending if missing
    if (!baseScript.cta || !String(baseScript.cta).trim()) {
      baseScript.cta = 'Follow for more cinematic stories.';
    }

    // Hashtags: safe defaults if missing
    if (!Array.isArray(baseScript.hashtags) || baseScript.hashtags.length === 0) {
      baseScript.hashtags = ['#cinematic', '#storytelling', '#aivideo', '#faceless'];
    }

    const outputMode = String(outputFormat || '').toLowerCase();

    // Optional pipeline output: Text-to-Image + Image-to-Video prompt pack
    if (outputMode === 'tti-i2v') {
      const title = String(baseScript.title || '').trim();
      const snapshotHook = (firstScene?.description || '').toString().split('\n')[0].trim();
      const snapshotClimax = (lastScene?.description || '').toString().split('\n')[0].trim();

      baseScript.pipeline = {
        mode: 'tti-i2v',
        image_prompt_card: [
          `IMAGE PROMPT-`,
          `TITLE: ${title}`,
          `SNAPSHOT: Hook: ${snapshotHook || baseScript.hook}. Mystery: ${baseScript.synopsis}. Climax: ${snapshotClimax || 'Decisive rescue/action payoff.'} End: Warm proof-of-safety closure.`,
          `RHYTHM: tension → curiosity → escalation → peak → relief → warmth`,
          `RETENTION: follow-cam pursuit + delayed reveal + false setback + satisfying resolution`
        ].join('\n'),
        text_to_image: (baseScript.scenes || []).map((s: any) => {
          const env = s?.visuals?.environment || 'cinematic environment';
          const subj = s?.visuals?.subject || 'main subject';
          const light = s?.visuals?.lighting_style || 'cinematic lighting';
          const palette = s?.visuals?.color_palette || 'natural, high-contrast palette';
          return {
            scene_number: s.scene_number,
            prompt: `Ultra-realistic cinematic keyframe, ${env}. Subject: ${subj}. Action frozen at the most readable moment of the scene. Shot: ${s.camera || 'cinematic shot'}, shallow depth of field, 35mm lens look. Lighting: ${light}. Color: ${palette}. Emotion beat matches the story progression. No text, no logos, no watermarks, no extra limbs, no distortions.`
          };
        }),
        image_to_video: (baseScript.scenes || []).map((s: any) => {
          const env = s?.visuals?.environment || 'cinematic environment';
          const subj = s?.visuals?.subject || 'main subject';
          const light = s?.visuals?.lighting_style || 'cinematic lighting';
          return {
            scene_number: s.scene_number,
            prompt: `7–9 second ultra-realistic cinematic clip continuing the same identities. Setting: ${env}. Subject: ${subj}. Motion plan: primary subject moves first, then secondary environment motion (wind/rain/particles) follows. Camera: ${s.camera || 'smooth handheld follow-cam'} with one motivated move. Lighting remains: ${light}. No morphing, no identity drift, no extra limbs, no text/logos. Transition out: match cut / motion bridge to next scene.`
          };
        })
      };

      // IMPORTANT: When the user selects Format 2, return ONLY Format 2 output.
      // Minimize payload for the dashboard UI, but keep duration for accurate timecodes.
      baseScript.scenes = (baseScript.scenes || []).map((s: any) => ({
        scene_number: s.scene_number,
        duration: s.duration || '8s',
      }));
    } else {
      // When Format 1 is selected, ensure pipeline is not present.
      if ((baseScript as any).pipeline) delete (baseScript as any).pipeline;
    }

    // Charge only on the first batch; continuation batches are $0.
    await logUsageAndCharge({
      req: request,
      tool,
      status: 'success',
      credits: shouldCharge ? creditsForTool(tool) : 0,
      meta: { niche, subNiche, scenes: baseScript?.scenes?.length || null, startScene, generationId: generationId || undefined }
    });
    return NextResponse.json({ script: baseScript });

  } catch (error: any) {
    console.error('API Error:', error);
    await logUsageAndCharge({ req: request, tool: 'faceless-script', status: 'error', credits: 0, meta: { message: error?.message } });
    
    // Provide more helpful error messages
    let userFriendlyError = 'Script generation failed. Please try again.';
    let suggestions = [
      'Try again in a few minutes',
      'Check if your API keys have sufficient quota',
      'Verify your API keys are valid and active'
    ];
    
    if (error.message?.includes('All providers failed')) {
      userFriendlyError = 'All AI providers are currently unavailable due to quota limits.';
      suggestions = [
        'Wait for quota reset (usually at midnight UTC)',
        'Add more API keys to your .env file',
        'Upgrade your API provider plans',
        'Try again later when quota resets'
      ];
    } else if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      userFriendlyError = 'API quota exceeded. Your current plan limits have been reached.';
      suggestions = [
        'Wait for quota reset (usually at midnight UTC)',
        'Upgrade your Gemini/OpenAI/other provider plans',
        'Add additional API keys to distribute load',
        'Try again after quota resets'
      ];
    } else if (error.message?.includes('401') || error.message?.includes('invalid')) {
      userFriendlyError = 'Invalid API keys detected. Please check your API key configuration.';
      suggestions = [
        'Verify API keys in your .env file',
        'Check if keys have expired',
        'Ensure keys have proper permissions',
        'Generate new API keys if needed'
      ];
    } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      userFriendlyError = 'Rate limit reached. Too many requests in a short time.';
      suggestions = [
        'Wait 1-2 minutes before trying again',
        'Reduce request frequency',
        'Upgrade to higher rate limit plans',
        'Add more API keys for load distribution'
      ];
    } else if (error.message?.includes('timeout')) {
      userFriendlyError = 'Request timed out. The AI service took too long to respond.';
      suggestions = [
        'Try with a shorter video duration',
        'Reduce the complexity of your topic',
        'Try again with a simpler prompt',
        'Check your internet connection'
      ];
    }
    
    return NextResponse.json({ 
      error: userFriendlyError,
      details: error.message,
      suggestions,
      providersAttempted: error.providersAttempted || [],
      totalAttempts: error.totalAttempts || 0,
      timestamp: new Date().toISOString(),
      helpText: 'The system tried multiple AI providers but all failed. This is usually due to quota limits.'
    }, { status: 500 });
  }
};