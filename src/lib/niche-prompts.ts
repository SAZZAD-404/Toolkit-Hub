// Niche-specific prompt enhancements
export const getNichePrompt = (niche: string): string => {
  switch (niche) {
    case 'car-restoration':
      return `
**CAR RESTORATION NICHE RULES:**
- The CAR is the main character and identity anchor (not a human)
- MANDATORY SEQUENCE: Discovery → Transport → Inspection → Cleaning/Stripping → Preparation → Repair/Work → Assembly → Cinematic Reveal
- Car Identity Lock: Same model, year, trim, body color/shape throughout
- Document the car's transformation state in each scene (rusty → stripped → primed → painted)
- Focus on mechanical details, tools, and restoration techniques
- Include authentic workshop atmosphere with proper lighting
- Show progression of car condition logically
- Use close-ups of mechanical components and restoration work
- Include "characters_in_scene" with the car as main subject
`;

    case 'monkey-cooking':
      return `
**MONKEY VILLAGE COOKING NICHE RULES:**
- Multiple monkey characters with FIXED identity anchors
- Each monkey MUST have: Gender, Face structure, Body color, Height/proportions
- Jungle bamboo kitchen setting with natural materials
- High-fidelity ASMR focus: chopping, sizzling, bubbling sounds
- Physical coordination between multiple characters
- Traditional cooking methods and natural ingredients
- Cozy village atmosphere with bamboo structures
- Focus on teamwork and community cooking
- Include detailed food preparation sequences
- Maintain character consistency across all scenes
`;

    case 'animal-cooking':
      return `
**ANIMAL VILLAGE COOKING NICHE RULES:**
- Multiple animal characters (rabbits, foxes, bears, etc.)
- Wholesome and magical storytelling atmosphere
- Each animal has consistent clothing and accessories
- Cozy village setting with warm lighting
- Focus on friendship and cooperation
- Magical cooking elements (sparkles, glowing ingredients)
- Stylized features while maintaining realism
- Family-friendly content with positive emotions
- Include seasonal ingredients and traditional recipes
- Maintain consistent character personalities
`;

    case 'historical-mystery':
      return `
**HISTORICAL MYSTERY NICHE RULES:**
- SUSPENSE MODE: Dark, cinematic lighting with Chiaroscuro effects
- Use Dutch angles and macro zoom shots for tension
- Focus on ancient artifacts, documents, and historical locations
- Psychological micro-expressions: sweating, dilated pupils, trembling
- ASMR elements: heavy breathing, mechanical clicks, echoing footsteps
- Gradual visual reveals with flashlights cutting through darkness
- Hushed, intense narration with rhetorical questions
- High-detail textures: weathered stone, faded ink, dust particles
- Environmental patina reflecting character's internal state
- Haunting cello or distorted piano score
- Race against time or forbidden knowledge themes
`;

    case 'animal-rescue':
      return `
**ANIMAL RESCUE (VISUAL-ONLY) NICHE RULES:**
- NO dialogue, NO spoken narration, NO subtitles, NO on-screen text. Story must be understood through visuals only.
- Core emotional arc: vulnerability → urgency → near-loss → commitment → decisive rescue → warm proof-of-safety ending.
- Include at least one micro-beat per scene: new clue / obstacle / escalation / tender gesture / reveal.
- Midpoint BIG REVEAL around ~50% runtime; ONE false setback around ~65% runtime.
- Show stakes without gore: behavior, environment, framing, time pressure.
- Continuity lock: consistent animal markings/patterns; if mother+babies, keep baby count constant.
- audio_mix.audio_content_in_English must describe ambience/SFX only (no speech).
`;

    default:
      return `
**GENERAL NICHE RULES:**
- Maintain professional cinematic quality
- Focus on clear storytelling progression
- Use varied camera angles and movements
- Include detailed environmental descriptions
- Ensure character consistency if applicable
- Create engaging narrative flow
`;
  }
};

export const getNicheMetadata = (niche: string) => {
  const nicheData = {
    'car-restoration': {
      name: 'Car Restoration',
      expectedDuration: '15-20 minutes',
      complexity: 'Advanced',
      keyFeatures: ['Logical Progression', 'Car Identity Anchor', 'Workshop Atmosphere']
    },
    'monkey-cooking': {
      name: 'Monkey Village Cooking',
      expectedDuration: '10-15 minutes', 
      complexity: 'Intermediate',
      keyFeatures: ['Multi-Character', 'ASMR Focus', 'Jungle Kitchen']
    },
    'animal-cooking': {
      name: 'Animal Village Cooking',
      expectedDuration: '8-12 minutes',
      complexity: 'Beginner',
      keyFeatures: ['Wholesome Story', 'Magical Elements', 'Cozy Atmosphere']
    },
    'historical-mystery': {
      name: 'Historical Mystery',
      expectedDuration: '12-18 minutes',
      complexity: 'Advanced', 
      keyFeatures: ['Suspense Mode', 'Chiaroscuro Lighting', 'Psychological Depth']
    },
    'animal-rescue': {
      name: 'Animal Rescue',
      expectedDuration: '10-15 minutes',
      complexity: 'Advanced',
      keyFeatures: ['Visual-Only Storytelling', 'High Empathy Note', 'Continuity Lock', 'Proof-of-Safety Ending']
    }
  };

  return nicheData[niche as keyof typeof nicheData] || {
    name: 'General',
    expectedDuration: '8-15 minutes',
    complexity: 'Beginner',
    keyFeatures: ['Standard Storytelling']
  };
};