## Project Summary
A professional faceless video script generation platform built with Next.js. It leverages multiple AI models (Gemini 2.0, Groq Llama 3.3, OpenRouter) to create cinematic, high-quality storytelling scripts for premium niches. The system is designed for high-fidelity "Ultra-realistic CGI" visual outputs and perfect narrative continuity, producing sequential 8-second scenes with multi-angle camera directions.

## Tech Stack
- Framework: Next.js 15+ (App Router)
- Language: TypeScript
- AI Integration: Gemini 2.0 (Primary), Groq (Llama 3.3), OpenRouter, GitHub Models
- Database/Auth: Supabase
- Frontend: Tailwind CSS, Lucide React, Framer Motion, Recharts
- Utilities: JSZip (for script downloads)

## Architecture
- `src/app/dashboard/page.tsx`: Real-time telemetry dashboard for monitoring neural core performance and history.
- `src/app/dashboard/faceless-video/generate/page.tsx`: Advanced UI for niche-specific generation.
- `src/app/api/faceless-script/route.ts`: Core engine for batch script generation, continuity management, and strict JSON enforcement.
- `src/lib/ai.ts`: Centralized AI client management with failover logic.

## User Preferences
- ALWAYS communicate in English. Use of Bengali or any other language is STRICTLY FORBIDDEN.
- Entire UI and platform content must be in English only.
- No comments unless explicitly requested.
- Focus on professional, cinematic aesthetics with a "Historical Mystery + Emotion" theme.
- Output ONLY JSON for scripts.
- No subtitles or external commentary in scripts.
- Sequential 8-second scenes with 3-4 camera angles per scene.
- Extreme detail scaling: more duration equals deeper details (Max duration: 20 minutes).

## Project Guidelines
- **UI Theme (Historical Mystery + Emotion)**: The platform UI should evoke a sense of suspense, mystery, and emotional depth. Use dark, cinematic palettes, high-contrast lighting (Chiaroscuro), and elegant, slightly weathered textures. Typography should be sophisticated and evoke a "noir" or "historical archive" feel.
- Always use relative URLs for client-side API calls.
    - **GLOBAL MASTER RULE PROMPT (ALL NICHES)**:
        1. **SEAMLESS PROFESSIONAL NARRATIVE (GLOBAL)**: Generate a seamless, professional video narrative for any given niche. Ensure that each video segment follows a logical, continuous flow, with no abrupt breaks or missing steps. Each scene should naturally transition into the next, maintaining consistency in tone, pacing, and detail. Include all critical steps relevant to the niche, ensuring that no important actions or transitions are skipped. The final output should look like a cohesive, realistic story that feels natural and human-like, avoiding any artificial patterns or inconsistencies. The entire video must be ONE continuous serial narrative from Scene 1 to the end.
        2. **DOCUMENTARY FLOW & LOGICAL PROGRESSION (CRITICAL)**: For any project-based or process-oriented narrative (e.g., Car Restoration, Building, Exploration), you MUST follow a logical, step-by-step documentary progression. DO NOT skip essential phases. For a restoration project, the sequence MUST be: Discovery of the subject -> Transporting to the workspace -> Initial thorough inspection -> Cleaning/Stripping -> Preparation -> Actual Repair/Work -> Final Assembly -> Cinematic Reveal. The narrative must maintain continuity, avoiding any abrupt jumps or missing steps. The final output should look like a cohesive, realistic documentary.
        3. **SCENE DURATION FIXED**: Each scene is EXACTLY 8 seconds.
        4. **CAMERA ANGLE RULE**: Every scene MUST include 3 to 4 distinct, UNIQUE camera shot angles with exact timestamps (e.g., • (0s → 3s) [WIDE-SHOT]: ...).
        5. **BACKGROUND NARRATION / VOICEOVER (MANDATORY)**: Every scene MUST include background narration that tells the story as it unfolds. The narration MUST align perfectly with the scene's visuals and progress the story. Each script section must specify both the visual direction and the spoken narration.
        6. **DESCRIPTION FORMAT**: Follow the mandatory structure with divider lines (───────────────) and specific headers (✍️ CAMERA DIRECTION).
        
        Mandatory description layout:
        SCENE [NUMBER]
        DURATION: 8s
        VISUAL STYLE: [STYLE]
        LIGHTING: [LIGHTING]

        [DESCRIPTION]

        ✍️ CAMERA DIRECTION:
        ───────────────
        • (0s → 3s) [SHOT 1]: ...
        • (3s → 6s) [SHOT 2]: ...
        • (6s → 8s) [SHOT 3]: ...
        ──────────────
        [Detailed Paragraph]

        Ultra-realistic CGI: ...
        STRICTLY FORBIDDEN: ...
        Transition into next scene: ...

        [CAMERA BEHAVIOR]
        ...
        [NARRATION / VOICE OVER]
        ...
        [AUDIO MIX]
        ...
        6. **DETAIL SCALING**: Hyper-detailed descriptions for every second (sub-surface scattering, lighting wavelength, micro-expressions).
        7. **MULTI-CHARACTER COORDINATION**: Describe physical coordination and collective action. Provide individual character breakdowns for EVERY character.
        8. **STORY PROGRESSION & ANTI-LOOPING (STRICT)**: The narrative MUST move forward in time. NEVER repeat or regenerate the same action. Each scene must be unique and advance the story. No duplicate scenes or redundant elements should appear. Each new scene must build upon the last—ensuring a natural, evolving storyline without redundancy.
        9. **CONTINUITY LOCK**: Same identity, texture, and environment progression across ALL scenes using strict continuity anchors.
        10. **"CONTINUOUS SHOT" SEAMLESS TRANSITIONS**: Transitions between scenes must be smooth, as if the entire story was filmed in one continuous shot. Every scene MUST end in a way that naturally flows into the next scene—maintaining the same atmosphere, pacing, and emotional tone. Every scene MUST end with: "Transition into next scene: Motion continues seamlessly using match-cut, motion bridge, and audio bridge."
        11. **RENDER STYLE**: Mandatory "Ultra-realistic CGI: High-quality video rendering with professional production values."
        12. **STRICT RESTRICTIONS**: Explicitly forbid cartoon exaggeration, anime, game look, human dialogue, direct eye contact, and camera awareness.
        13. **IDENTICAL STRUCTURE**: The JSON structure MUST remain identical for single or multiple characters, scaling depth and multi-character details within established fields.
        14. **HUMAN-LIKE NARRATION (CRITICAL)**: Maintain a consistent, human-like narration tone from start to finish. The narration and actions should be human-like, realistic, and free from any artificial patterns.
        15. **AUTHENTIC STORYTELLING**: Avoid mechanical or formulaic phrasing. Mimic natural human storytelling with subtle pauses, emotional nuances, realistic actions, and believable emotions. It should feel like a story crafted by a human storyteller, ensuring a natural, immersive experience without artificial patterns or repetitive structures.
        16. **SEAMLESS FLOW**: Ensure smooth transitions and coherent narration for a continuous short film experience from start to finish. No scene should feel disjointed or abrupt.
        18. **STRICT CHARACTER CONSISTENCY & PHYSICAL LOCK (MANDATORY)**: Characters and concepts MUST NOT be random. The character's EXACT face features, body shape/type, and body color (skin/fur) MUST remain 100% identical from Scene 1 to the final scene. For long-form videos (up to 20 minutes), this "Identity Anchor" must remain frozen across every single scene without exception. The `identity_anchor_prompt` (30-50 words) MUST explicitly define: 1) Precise facial structure/features, 2) Exact body color/skin tone/fur pattern, and 3) Specific body shape and proportions. These three elements (Face, Body Color, Body Shape) are MANDATORY for every character. No wardrobe changes unless the script explicitly requires it for the story. You MUST populate "characters_in_scene" for EVERY scene with this visual DNA lock.
        21. **GLOBAL PROJECT DNA PERSISTENCE**: For videos of any length (up to 20 minutes), the character DNA defined in Scene 1 MUST be strictly carried over to all subsequent batches/scenes. Any deviation or "identity drift" is strictly forbidden. The system must treat the entire project as a single, immutable visual universe.
        19. **ROLE & ACTION CONSISTENCY**: A character's role (e.g., shopkeeper) and their behavior must follow a logical sequence. Character role-swapping is strictly forbidden.
        20. **NICHE-SPECIFIC RULES (IDENTITY ANCHOR LOGIC)**:
            - **CAR RESTORATION**: The car ITSELF is the "Identity Anchor". Every scene MUST maintain the same car model, year, trim, and body color/shape. The car's state (rusty, stripped, primed, painted) must follow a logical restoration arc. Include the car in "visuals.subject" and "characters_in_scene".
            - **MONKEY VILLAGE COOKING**: Use "Identity Anchor" logic for MULTIPLE monkey characters. Each monkey MUST have a unique and fixed: 1) **Gender**, 2) **Face Look & Structure (gothon)**, 3) **Specific Face & Body Color**, and 4) **Body Shape/Proportions**. Maintain absolute consistency in physical proportions and any accessories across all scenes. Focus on physical coordination between characters and high-fidelity ASMR in a jungle bamboo kitchen.
            - **ANIMAL VILLAGE COOKING**: Use "Identity Anchor" logic for MULTIPLE animal characters. Each animal MUST have a permanent: 1) **Gender**, 2) **Face Look & Structure (gothon)**, 3) **Specific Face & Body Color**, and 4) **Fixed Height/Body Shape**. Maintain absolute consistency in stylized features and cozy clothing. Vibe: Wholesome and magical storytelling.
            - **HISTORICAL MYSTERY**: Identity Anchor logic applies to the protagonist and key historical artifacts. Use "Suspense Mode" with dark, cinematic lighting, heavy Chiaroscuro (extreme contrast), and Dutch angles. Narratives must focus on a "race against time" or "forbidden knowledge" vibe. Use gradual visual reveals (e.g., flashlights cutting through pitch black, dust motes dancing in single light beams). Narration must be hushed, intense, and filled with rhetorical questions to maximize engagement. Focus on high-detail textures of ancient artifacts (cracks, weathered stone, faded ink). **ADVANCED SUSPENSE**: 1) **Audio Tension (ASMR)**: Isolated sounds of heavy breathing, mechanical clicks of ancient locks, and echoing footsteps. 2) **Hidden Visuals**: Fleeting shadows in the peripheral frame, reflections of unseen entities in dusty mirrors/glass. 3) **Psychological Micro-expressions**: Extreme close-ups on sweating temples, dilating pupils, or trembling hands. 4) **Pacing**: Use rhythmic "Heartbeat" cutting during danger and "Time-stop" slow-motion for critical discoveries. **EMOTIONAL RESONANCE**: 1) **Nostalgic Framing**: Use soft focus or golden lighting for artifacts linked to a character's past (grief, longing). 2) **Internal Conflict**: Capture vulnerability through subtle facial ticks and lingering shots on expressive eyes during difficult choices. 3) **Environmental Patina**: The environment must reflect the character's internal state (e.g., crumbling ruins representing fading hope). 4) **Emotional Score**: Use haunting cello or distant, distorted piano to evoke deep sadness or frantic desperation.
              - **MAYAJAL STYLE**: High-engagement mystery facts. Must start with a shocking English hook question. Use Chiaroscuro lighting, intense suspense, and fast-paced camera changes (Dutch angles, macro zooms). Focus on "Secret" or "Unknown" information delivery.
        17. **MANDATORY JSON STRUCTURE**: Every scene object in the script MUST follow this structure:
            ```json
            {
              "scene_number": "",
              "scene_id": "",
              "dialogue_summary": "",
              "duration": "8s",
              "description": "",
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
                  "name": "Full name",
                  "identity_anchor_prompt": "Permanent visual description (e.g. 'A 30-year-old man with sharp jawline...')",
                  "current_action": "Action in this scene",
                  "visual_details": "Scene-specific details"
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
                "audio_content_in_English": ""
              }
            }
            ```


## Common Patterns
- Batch generation: First batch initializes the story; subsequent batches use continuity anchors.
- JSON Safety: Always use `parseAIJsonSafe` to handle AI markdown errors.
- Cinematic Transitions: Every scene MUST end with the mandatory "Transition into next scene" line and the "NO CUT" logic.