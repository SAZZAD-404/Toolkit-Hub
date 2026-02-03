export const CREDIT_LIMIT_MONTHLY = 100;

// Fixed credits per tool (as requested)
export const TOOL_CREDITS: Record<string, number> = {
  // scripts
  'simple-script': 10,
  'faceless-script': 10,

  // summarize
  summarize: 2,

  // tts
  tts: 3,

  // image
  'generate-image': 5,

  // video
  'image-to-video': 10,
  'text-to-video': 10,
  'faceless-video': 10,
};

export function creditsForTool(tool: string): number {
  return TOOL_CREDITS[tool] ?? 1;
}
