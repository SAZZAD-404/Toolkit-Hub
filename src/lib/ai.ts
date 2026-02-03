// src/lib/ai.ts - Robust AI Client using Fetch (No SDK dependencies)

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get keys from environment with numbered support
const getKeys = (prefix: string) => {
  const keys: string[] = [];
  
  // Get base key (e.g., GEMINI_API_KEY)
  if (process.env[prefix]) {
    keys.push(process.env[prefix]!);
  }
  
  // Get numbered keys (e.g., GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.)
  let i = 1;
  while (process.env[`${prefix}_${i}`]) {
    keys.push(process.env[`${prefix}_${i}`]!);
    i++;
  }
  
  return keys.filter(Boolean);
};

const GEMINI_KEYS = getKeys('GEMINI_API_KEY');
const GROQ_KEYS = getKeys('GROQ_API_KEY');
const OPENAI_KEYS = getKeys('OPENAI_API_KEY');
const OPENROUTER_KEYS = getKeys('OPENROUTER_API_KEY');
const DEAPI_KEYS = getKeys('DEAPI_API_KEY');
const GITHUB_KEYS = getKeys('GITHUB_TOKEN'); // Updated for new GitHub endpoint
const CEREBRAS_KEYS = getKeys('CEREBRAS_API_KEY');
const XAI_KEYS = getKeys('XAI_API_KEY');
const DEEPSEEK_KEYS = getKeys('DEEPSEEK_API_KEY');
const ROUTEWAY_KEYS = getKeys('ROUTEWAY_API_KEY');

// NEW PROVIDERS
const ANTHROPIC_KEYS = getKeys('ANTHROPIC_API_KEY');
const PERPLEXITY_KEYS = getKeys('PERPLEXITY_API_KEY');
const TOGETHER_KEYS = getKeys('TOGETHER_API_KEY');
const MISTRAL_KEYS = getKeys('MISTRAL_API_KEY');
const HUGGINGFACE_KEYS = getKeys('HUGGINGFACE_TOKEN');
const COHERE_KEYS = getKeys('COHERE_API_KEY');
const GIGACHAT_KEYS = getKeys('GIGACHAT_API_KEY');
const REPLICATE_KEYS = getKeys('REPLICATE_API_TOKEN');
const STABILITY_KEYS = getKeys('STABILITY_API_KEY');
const ELEVENLABS_KEYS = getKeys('ELEVENLABS_API_KEY');

// Key rotation with failure tracking
const keyFailureTracker = new Map<string, Set<string>>();

const getNextWorkingKey = (keys: string[], provider: string): string | null => {
  if (!keys.length) return null;
  
  const failedKeys = keyFailureTracker.get(provider) || new Set();
  const workingKeys = keys.filter(key => !failedKeys.has(key));
  
  if (workingKeys.length === 0) {
    // Reset failure tracker if all keys failed (maybe temporary issue)
    keyFailureTracker.delete(provider);
    return keys[0];
  }
  
  // Return random working key
  return workingKeys[Math.floor(Math.random() * workingKeys.length)];
};

const markKeyAsFailed = (key: string, provider: string) => {
  if (!keyFailureTracker.has(provider)) {
    keyFailureTracker.set(provider, new Set());
  }
  keyFailureTracker.get(provider)!.add(key);
  console.warn(`[Key Rotation] Marked ${provider} key as failed: ${key.slice(0, 10)}...`);
};

// --- Improved Gemini Implementation with Key Rotation ---
export const getGeminiWithKey = (apiKey: string, baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta') => {
  return {
    getGenerativeModel: (config: { model: string }) => ({
      generateContent: async (parts: any[]) => {
        const model = config.model || "gemini-1.5-flash-latest";
        const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
        
        const contents = parts.map(part => {
          if (typeof part === 'string') return { role: 'user', parts: [{ text: part }] };
          if (part.inlineData) return { role: 'user', parts: [{ inline_data: part.inlineData }] };
          return part;
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          const errorMsg = err.error?.message || response.statusText;
          
          // Mark key as failed for auth/quota errors
          if (response.status === 401 || response.status === 403 || response.status === 429) {
            markKeyAsFailed(apiKey, 'gemini');
          }
          
          throw new Error(`Gemini API Error (${response.status}): ${errorMsg}`);
        }

        const data = await response.json();
        return {
          response: {
            text: () => data.candidates?.[0]?.content?.parts?.[0]?.text || ""
          }
        };
      }
    })
  };
};

export const getGemini = () => {
  const key = getNextWorkingKey(GEMINI_KEYS, 'gemini');
  if (!key) throw new Error("No working Gemini");
  return getGeminiWithKey(key);
};

// --- Improved OpenAI Compatible Client with Key Rotation ---
const createOpenAICompatibleClientWithKey = (apiKey: string, baseURL: string, provider: string) => ({
  chat: {
    completions: {
      create: async (config: any) => {
        const response = await fetch(`${baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(config)
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          const errorMsg = err.error?.message || response.statusText;
          
          // Mark key as failed for auth/quota errors
          if (response.status === 401 || response.status === 403 || response.status === 429) {
            markKeyAsFailed(apiKey, provider);
          }
          
          throw new Error(`${provider} API Error (${response.status}): ${errorMsg}`);
        }

        return await response.json();
      }
    }
  },
  audio: {
    transcriptions: {
      create: async (config: { file: File, model: string }) => {
        const formData = new FormData();
        formData.append('file', config.file);
        formData.append('model', config.model);

        const response = await fetch(`${baseURL}/audio/transcriptions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}` },
          body: formData
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          const errorMsg = err.error?.message || response.statusText;
          
          if (response.status === 401 || response.status === 403 || response.status === 429) {
            markKeyAsFailed(apiKey, provider);
          }
          
          throw new Error(`${provider} Transcription Error (${response.status}): ${errorMsg}`);
        }

        return await response.json();
      }
    }
  }
});

const createOpenAICompatibleClient = (apiKey: string, baseURL: string) => ({
  chat: {
    completions: {
      create: async (config: any) => {
        const response = await fetch(`${baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(config)
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(`AI API Error: ${err.error?.message || response.statusText}`);
        }

        return await response.json();
      }
    }
  },
  audio: {
    transcriptions: {
      create: async (config: { file: File, model: string }) => {
        const formData = new FormData();
        formData.append('file', config.file);
        formData.append('model', config.model);

        const response = await fetch(`${baseURL}/audio/transcriptions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}` },
          body: formData
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(`Transcription Error: ${err.error?.message || response.statusText}`);
        }

        return await response.json();
      }
    }
  }
});

// --- Provider-specific clients with key rotation ---
export const getOpenAI = () => {
  const key = getNextWorkingKey(OPENAI_KEYS, 'openai');
  if (!key) throw new Error("No working OpenAI API keys available");
  return createOpenAICompatibleClientWithKey(key, "https://api.openai.com/v1", 'openai');
};

export const getGroq = () => {
  const key = getNextWorkingKey(GROQ_KEYS, 'groq');
  if (!key) throw new Error("No working Groq API keys available");
  return createOpenAICompatibleClientWithKey(key, "https://api.groq.com/openai/v1", 'groq');
};

export const getGroqClient = getGroq;
export const getOpenAIClient = getOpenAI;

export const getOpenRouterClient = () => {
  const key = getNextWorkingKey(OPENROUTER_KEYS, 'openrouter');
  if (!key) return null;
  return createOpenAICompatibleClientWithKey(key, "https://openrouter.ai/api/v1", 'openrouter');
};

export const createDeapiClient = () => {
  const key = getNextWorkingKey(DEAPI_KEYS, 'deapi');
  if (!key) throw new Error("No working Deapi keys available");
  return createOpenAICompatibleClientWithKey(key, "https://api.deapi.ai/api/v1/client", 'deapi');
};

export const getGitHubModelsClient = () => {
  const key = getNextWorkingKey(GITHUB_KEYS, 'github');
  if (!key) return null;
  return createOpenAICompatibleClientWithKey(key, "https://models.github.ai/inference", 'github');
};

export const getCerebrasClient = () => {
  const key = getNextWorkingKey(CEREBRAS_KEYS, 'cerebras');
  if (!key) throw new Error("No working Cerebras API keys available");
  return createOpenAICompatibleClientWithKey(key, "https://api.cerebras.ai/v1", 'cerebras');
};

export const getXAIClient = () => {
  const key = getNextWorkingKey(XAI_KEYS, 'xai');
  if (!key) throw new Error("No working XAI API keys available");
  return createOpenAICompatibleClientWithKey(key, "https://api.x.ai/v1", 'xai');
};

export const getDeepSeekClient = () => {
  const key = getNextWorkingKey(DEEPSEEK_KEYS, 'deepseek');
  if (!key) throw new Error("No working DeepSeek API keys available");
  return createOpenAICompatibleClientWithKey(key, "https://api.deepseek.com/v1", 'deepseek');
};

export const getRoutewayClient = () => {
  const key = getNextWorkingKey(ROUTEWAY_KEYS, 'routeway');
  if (!key) throw new Error("No working Routeway API keys available");
  return createOpenAICompatibleClientWithKey(key, "https://routeway.ai/v1", 'routeway');
};

export const getGeminiClient = () => {
  const client = getGemini();
  return {
    models: {
      generateContent: async (config: any) => {
        const model = client.getGenerativeModel({ model: config.model });
        const parts = config.contents?.[0]?.parts?.map((p: any) => p.text || p) || [];
        const result = await model.generateContent(parts);
        return { text: result.response.text() };
      }
    }
  };
};

// Improved provider rotation - Prioritize high-performance models for scripting
export const getRotatedProviders = (preferred?: string) => {
  // Prioritize providers that are currently working well based on the context
  const highPerformance = ['cerebras', 'xai', 'deepseek'];
  const stable = ['github', 'gemini', 'groq'];
  const fallback = ['openai', 'openrouter', 'deapi'];
  
  const all = [...highPerformance, ...stable, ...fallback];
  
  if (preferred && all.includes(preferred)) {
    // Put preferred first, then others as fallback
    return [preferred, ...all.filter(p => p !== preferred)];
  }
  return all;
};

// Enhanced failover with provider-specific key rotation and detailed error tracking
export const callWithAiFailover = async (fn: (provider: string) => Promise<any>, preferred?: string) => {
  const providers = getRotatedProviders(preferred);
  const errors: Array<{provider: string, attempt: number, error: string, isKeyError: boolean, isRateLimit: boolean}> = [];
  let totalAttempts = 0;

  console.log(`[AI Failover] Starting with ${providers.length} providers. Preferred: ${preferred || 'none'}`);

  for (const provider of providers) {
    // Skip providers with no keys
    const keyStatus = getProviderKeyStatus();
    const providerStatus = keyStatus[provider as keyof typeof keyStatus];
    if (!providerStatus || providerStatus.total === 0) {
      console.warn(`[Failover] ⏭️ Skipping ${provider} - no keys available`);
      errors.push({
        provider,
        attempt: 0,
        error: 'No API keys configured',
        isKeyError: true,
        isRateLimit: false
      });
      continue;
    }

    // Try multiple keys for the same provider before moving to next provider
    const maxKeyAttempts = Math.min(3, providerStatus.total);
    
    for (let keyAttempt = 1; keyAttempt <= maxKeyAttempts; keyAttempt++) {
      totalAttempts++;
      try {
        console.log(`[Failover] 🔄 Trying ${provider} (attempt ${keyAttempt}/${maxKeyAttempts}) - Total attempts: ${totalAttempts}`);
        
        const result = await fn(provider);
        
        console.log(`[Failover] ✅ SUCCESS with ${provider} on attempt ${keyAttempt}`);
        return result;
        
      } catch (e: any) {
        const isKeyError = e.message?.includes('401') || e.message?.includes('403') || 
                          e.message?.includes('invalid') || e.message?.includes('expired') ||
                          e.message?.includes('unauthorized');
        
        const isRateLimit = e.message?.includes('429') || e.message?.includes('rate limit') || 
                           e.message?.includes('Too Many Requests') || e.message?.includes('quota');
        
        const isServerError = e.message?.includes('500') || e.message?.includes('502') || 
                             e.message?.includes('503') || e.message?.includes('504');
        
        console.warn(`[Failover] ❌ ${provider} attempt ${keyAttempt} failed: ${e.message}`);
        
        errors.push({
          provider,
          attempt: keyAttempt,
          error: e.message,
          isKeyError,
          isRateLimit
        });
        
        if (isRateLimit && keyAttempt < maxKeyAttempts) {
          // For rate limits, wait longer before trying next key
          console.log(`[Failover] ⏳ Rate limit detected, waiting 3s before next attempt...`);
          await delay(3000);
          continue;
        } else if (isKeyError && keyAttempt < maxKeyAttempts) {
          // Try next key for same provider
          console.log(`[Failover] 🔑 Key error detected, trying next key...`);
          await delay(500);
          continue;
        } else if (isServerError && keyAttempt < maxKeyAttempts) {
          // Server error, try again with same provider
          console.log(`[Failover] 🖥️ Server error detected, retrying in 2s...`);
          await delay(2000);
          continue;
        } else {
          // Move to next provider
          console.log(`[Failover] ➡️ Moving to next provider...`);
          break;
        }
      }
    }
  }
  
  // Generate detailed error message
  const keyErrors = errors.filter(e => e.isKeyError).length;
  const rateLimitErrors = errors.filter(e => e.isRateLimit).length;
  const serverErrors = errors.filter(e => !e.isKeyError && !e.isRateLimit).length;
  
  let errorSummary = `All ${providers.length} AI providers failed after ${totalAttempts} attempts. `;
  
  if (keyErrors > 0) errorSummary += `${keyErrors} key errors, `;
  if (rateLimitErrors > 0) errorSummary += `${rateLimitErrors} rate limit errors, `;
  if (serverErrors > 0) errorSummary += `${serverErrors} server errors. `;
  
  errorSummary += `Providers tried: ${providers.join(', ')}`;
  
  console.error(`[Failover] 💥 COMPLETE FAILURE: ${errorSummary}`);
  
  // Create user-friendly error message
  let userMessage = 'All AI providers failed. ';
  
  if (keyErrors === errors.length) {
    userMessage += 'API key issues. Please contact administrator.';
  } else if (rateLimitErrors > keyErrors) {
    userMessage += 'Rate limit exceeded. Please try again later.';
  } else {
    userMessage += 'Server issues. Please try again later.';
  }
  
  const error = new Error(userMessage);
  (error as any).details = {
    totalAttempts,
    providers: providers.length,
    keyErrors,
    rateLimitErrors,
    serverErrors,
    errors: errors.map(e => `${e.provider}(${e.attempt}): ${e.error}`)
  };
  
  throw error;
};

// Utility to check available keys for each provider
export const getProviderKeyStatus = () => {
  return {
    // TEXT GENERATION
    openrouter: { total: OPENROUTER_KEYS.length, failed: keyFailureTracker.get('openrouter')?.size || 0 },
    gemini: { total: GEMINI_KEYS.length, failed: keyFailureTracker.get('gemini')?.size || 0 },
    groq: { total: GROQ_KEYS.length, failed: keyFailureTracker.get('groq')?.size || 0 },
    openai: { total: OPENAI_KEYS.length, failed: keyFailureTracker.get('openai')?.size || 0 },
    cerebras: { total: CEREBRAS_KEYS.length, failed: keyFailureTracker.get('cerebras')?.size || 0 },
    xai: { total: XAI_KEYS.length, failed: keyFailureTracker.get('xai')?.size || 0 },
    deepseek: { total: DEEPSEEK_KEYS.length, failed: keyFailureTracker.get('deepseek')?.size || 0 },
    github: { total: GITHUB_KEYS.length, failed: keyFailureTracker.get('github')?.size || 0 },
    
    // NEW TEXT PROVIDERS
    anthropic: { total: ANTHROPIC_KEYS.length, failed: keyFailureTracker.get('anthropic')?.size || 0 },
    perplexity: { total: PERPLEXITY_KEYS.length, failed: keyFailureTracker.get('perplexity')?.size || 0 },
    together: { total: TOGETHER_KEYS.length, failed: keyFailureTracker.get('together')?.size || 0 },
    mistral: { total: MISTRAL_KEYS.length, failed: keyFailureTracker.get('mistral')?.size || 0 },
    huggingface: { total: HUGGINGFACE_KEYS.length, failed: keyFailureTracker.get('huggingface')?.size || 0 },
    cohere: { total: COHERE_KEYS.length, failed: keyFailureTracker.get('cohere')?.size || 0 },
    gigachat: { total: GIGACHAT_KEYS.length, failed: keyFailureTracker.get('gigachat')?.size || 0 },
    
    // IMAGE GENERATION
    stability: { total: STABILITY_KEYS.length, failed: keyFailureTracker.get('stability')?.size || 0 },
    deapi: { total: DEAPI_KEYS.length, failed: keyFailureTracker.get('deapi')?.size || 0 },
    replicate: { total: REPLICATE_KEYS.length, failed: keyFailureTracker.get('replicate')?.size || 0 },
    
    // TTS
    elevenlabs: { total: ELEVENLABS_KEYS.length, failed: keyFailureTracker.get('elevenlabs')?.size || 0 }
  };
};
