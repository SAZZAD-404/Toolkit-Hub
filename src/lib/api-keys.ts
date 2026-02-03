// Last Updated: 2026-01-27T12:00:00Z
export function getRandomDeapiKey(): string {
  const keys = [
    process.env.DEAPI_API_KEY_1,
    process.env.DEAPI_API_KEY_2,
    process.env.DEAPI_API_KEY_3,
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) return '';
  return keys[Math.floor(Math.random() * keys.length)];
}

export function getRandomGroqKey(): string {
  const keys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) return '';
  return keys[Math.floor(Math.random() * keys.length)];
}

export function getRandomOpenrouterKey(): string {
  const keys = [
    process.env.OPENROUTER_API_KEY_1,
    process.env.OPENROUTER_API_KEY_2,
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) return '';
  return keys[Math.floor(Math.random() * keys.length)];
}

export function getRandomGeminiKey(): string {
  const keys = [
    process.env.GEMINI_API_KEY1,
    process.env.GEMINI_API_KEY2,
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) return '';
  return keys[Math.floor(Math.random() * keys.length)];
}

export function getRandomOpenaiKey(): string {
  const keys = [
    process.env.OPENAI_API_KEY_1,
    process.env.OPENAI_API_KEY_2,
    process.env.OPENAI_API_KEY_3,
    process.env.OPENAI_API_KEY_4,
    process.env.OPENAI_API_KEY_5,
    process.env.OPENAI_API_KEY_6,
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) return '';
  return keys[Math.floor(Math.random() * keys.length)];
}

export function getRandomStabilityKey(): string {
  const keys = [
    process.env.STABILITY_API_KEY_1,
    process.env.STABILITY_API_KEY_2,
    process.env.STABILITY_API_KEY_3,
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) return '';
  return keys[Math.floor(Math.random() * keys.length)];
}

export function getRandomElevenLabsKey(): string {
  const keys = [
    process.env.ELEVENLABS_API_KEY_1,
    process.env.ELEVENLABS_API_KEY_2,
    process.env.ELEVENLABS_API_KEY_3,
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) return '';
  return keys[Math.floor(Math.random() * keys.length)];
}

export function getRandomCerebrasKey(): string {
  const keys = [
    process.env.CEREBRAS_API_KEY_1,
    process.env.CEREBRAS_API_KEY_2,
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) return '';
  return keys[Math.floor(Math.random() * keys.length)];
}

export function getRandomXAIKey(): string {
  const keys = [
    process.env.XAI_API_KEY_1,
    process.env.XAI_API_KEY_2,
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) return '';
  return keys[Math.floor(Math.random() * keys.length)];
}

export function getRandomDeepSeekKey(): string {
  const keys = [
    process.env.DEEPSEEK_API_KEY_1,
    process.env.DEEPSEEK_API_KEY_2,
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) return '';
  return keys[Math.floor(Math.random() * keys.length)];
}

export function getRandomGitHubToken(): string {
  const keys = [
    process.env.GITHUB_TOKEN_1,
    process.env.GITHUB_TOKEN_2,
    process.env.GITHUB_TOKEN_3,
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) return '';
  return keys[Math.floor(Math.random() * keys.length)];
}
