/**
 * Universal AI Manager - Centralized rotation and failover system
 * Integrates with existing Next.js 15 API routes with minimal changes
 */

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  provider?: string;
  keyUsed?: string;
  attempt?: number;
  executionTime?: number;
  providersAttempted?: string[];
  totalAttempts?: number;
}

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  models: string[];
  keyPrefix: string;
  priority: number;
  rateLimitDelay: number;
  maxRetries: number;
}

export type TextGenProvider = 'openrouter' | 'gemini' | 'github' | 'groq' | 'openai' | 'cerebras' | 'xai' | 'deepseek' | 'anthropic' | 'perplexity' | 'together' | 'mistral' | 'huggingface' | 'cohere' | 'gigachat';
export type ImageGenProvider = 'stability' | 'deapi' | 'replicate';
export type TTSProvider = 'elevenlabs' | 'deapi';

// ==========================================
// PROVIDER CONFIGURATIONS
// ==========================================

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  // TEXT GENERATION (LLM) - YOUR SELECTED 4 PROVIDERS
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet'],
    keyPrefix: 'OPENROUTER_API_KEY',
    priority: 1,
    rateLimitDelay: 2000,
    maxRetries: 3
  },
  
  mistral: {
    name: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    models: ['mistral-large-latest', 'mistral-small-latest'],
    keyPrefix: 'MISTRAL_API_KEY',
    priority: 2,
    rateLimitDelay: 2000,
    maxRetries: 3
  },

  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    keyPrefix: 'GROQ_API_KEY',
    priority: 3,
    rateLimitDelay: 2000,
    maxRetries: 3
  },

  github: {
    name: 'GitHub Models',
    baseUrl: 'https://models.github.ai/inference',
    models: ['gpt-4o-mini', 'deepseek/DeepSeek-V3-0324'],
    keyPrefix: 'GITHUB_TOKEN',
    priority: 4,
    rateLimitDelay: 2000,
    maxRetries: 3
  },

  // DISABLED PROVIDERS (FOR FUTURE USE)
  gemini: {
    name: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest'],
    keyPrefix: 'GEMINI_API_KEY',
    priority: 99,
    rateLimitDelay: 1000,
    maxRetries: 3
  },

  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-3.5-turbo', 'gpt-4o-mini'],
    keyPrefix: 'OPENAI_API_KEY',
    priority: 99,
    rateLimitDelay: 5000,
    maxRetries: 3
  },
  cerebras: {
    name: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    models: ['llama3.1-8b', 'llama3.1-70b'],
    keyPrefix: 'CEREBRAS_API_KEY',
    priority: 99,
    rateLimitDelay: 2000,
    maxRetries: 3
  },
  xai: {
    name: 'XAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    models: ['grok-2-latest', 'grok-vision-beta'],
    keyPrefix: 'XAI_API_KEY',
    priority: 99,
    rateLimitDelay: 3000,
    maxRetries: 3
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder'],
    keyPrefix: 'DEEPSEEK_API_KEY',
    priority: 7,
    rateLimitDelay: 2000,
    maxRetries: 3
  },


  // NEW PROVIDERS FROM .ENV
  anthropic: {
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    keyPrefix: 'ANTHROPIC_API_KEY',
    priority: 8,
    rateLimitDelay: 2000,
    maxRetries: 3
  },
  perplexity: {
    name: 'Perplexity',
    baseUrl: 'https://api.perplexity.ai',
    models: ['llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-large-128k-online'],
    keyPrefix: 'PERPLEXITY_API_KEY',
    priority: 9,
    rateLimitDelay: 2000,
    maxRetries: 3
  },
  together: {
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    models: ['meta-llama/Llama-3-8b-chat-hf', 'meta-llama/Llama-3-70b-chat-hf'],
    keyPrefix: 'TOGETHER_API_KEY',
    priority: 10,
    rateLimitDelay: 2000,
    maxRetries: 3
  },
  huggingface: {
    name: 'Hugging Face',
    baseUrl: 'https://api-inference.huggingface.co/models',
    models: ['microsoft/DialoGPT-large', 'facebook/blenderbot-400M-distill'],
    keyPrefix: 'HUGGINGFACE_TOKEN',
    priority: 12,
    rateLimitDelay: 3000,
    maxRetries: 3
  },
  cohere: {
    name: 'Cohere',
    baseUrl: 'https://api.cohere.ai/v1',
    models: ['command-r-plus', 'command-r'],
    keyPrefix: 'COHERE_API_KEY',
    priority: 13,
    rateLimitDelay: 2000,
    maxRetries: 3
  },
  gigachat: {
    name: 'GigaChat',
    baseUrl: 'https://gigachat.devices.sberbank.ru/api/v1',
    models: ['GigaChat', 'GigaChat-Pro'],
    keyPrefix: 'GIGACHAT_API_KEY',
    priority: 14,
    rateLimitDelay: 3000,
    maxRetries: 3
  },

  // IMAGE GENERATION
  stability: {
    name: 'Stability AI',
    baseUrl: 'https://api.stability.ai/v2beta',
    models: ['stable-diffusion-3-5-large', 'stable-diffusion-3-5-medium'],
    keyPrefix: 'STABILITY_API_KEY',
    priority: 1,
    rateLimitDelay: 3000,
    maxRetries: 3
  },
  deapi: {
    name: 'DEAPI',
    baseUrl: 'https://api.deapi.ai/api/v1/client',
    models: ['flux-1.1-pro', 'flux-1-schnell'],
    keyPrefix: 'DEAPI_API_KEY',
    priority: 2,
    rateLimitDelay: 2000,
    maxRetries: 3
  },
  replicate: {
    name: 'Replicate',
    baseUrl: 'https://api.replicate.com/v1',
    models: ['stability-ai/stable-diffusion', 'black-forest-labs/flux-schnell'],
    keyPrefix: 'REPLICATE_API_TOKEN',
    priority: 3,
    rateLimitDelay: 3000,
    maxRetries: 3
  },

  // TEXT-TO-SPEECH
  elevenlabs: {
    name: 'ElevenLabs',
    baseUrl: 'https://api.elevenlabs.io/v1',
    models: ['eleven_multilingual_v2', 'eleven_turbo_v2_5'],
    keyPrefix: 'ELEVENLABS_API_KEY',
    priority: 1,
    rateLimitDelay: 2000,
    maxRetries: 3
  }
};

// Provider categories
const PROVIDER_CATEGORIES = {
  TEXT_GEN: ['github', 'openrouter', 'mistral', 'gemini', 'openai', 'cerebras', 'xai', 'deepseek', 'anthropic', 'perplexity', 'together', 'huggingface', 'cohere', 'gigachat', 'groq'],
  IMAGE_GEN: ['stability', 'deapi', 'replicate'],
  TTS_GEN: ['elevenlabs', 'deapi']
};

// ==========================================
// KEY MANAGEMENT SYSTEM
// ==========================================

class KeyManager {
  private static keyCache = new Map<string, string[]>();
  private static keyIndex = new Map<string, number>();
  private static failedKeys = new Map<string, Set<string>>();

  static getAvailableKeys(provider: string): string[] {
    const cacheKey = `${provider}_keys`;
    
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }

    const config = PROVIDER_CONFIGS[provider];
    if (!config) return [];

    const keys: string[] = [];
    
    // First add the base key (without number)
    const baseKey = process.env[config.keyPrefix];
    if (baseKey) {
      keys.push(baseKey);
    }
    
    // Then add numbered keys (1, 2, 3, ...)
    let keyIndex = 1;
    while (true) {
      const keyName = `${config.keyPrefix}_${keyIndex}`;
      const keyValue = process.env[keyName];
      
      if (keyValue) {
        keys.push(keyValue);
        keyIndex++;
      } else {
        break;
      }
    }

    console.log(`[Key Manager] Found ${keys.length} keys for ${provider}: ${config.keyPrefix}`);
    this.keyCache.set(cacheKey, keys);
    return keys;
  }

  static getNextKey(provider: string, strategy: 'random' | 'round-robin' = 'round-robin'): string | null {
    const keys = this.getAvailableKeys(provider);
    if (keys.length === 0) return null;

    // Filter out failed keys
    const failedSet = this.failedKeys.get(provider) || new Set();
    const workingKeys = keys.filter(key => !failedSet.has(key));
    
    if (workingKeys.length === 0) {
      // Reset failed keys if all are failed (maybe temporary issue)
      console.log(`[Key Manager] All ${keys.length} keys failed for ${provider}, resetting failure tracker`);
      this.failedKeys.delete(provider);
      this.keyIndex.set(provider, 0); // Reset index
      return keys[0];
    }

    if (strategy === 'random') {
      const randomKey = workingKeys[Math.floor(Math.random() * workingKeys.length)];
      console.log(`[Key Manager] Using random key for ${provider}: ${randomKey.slice(0, 15)}... (${workingKeys.length}/${keys.length} working)`);
      return randomKey;
    }

    // Round-robin strategy - cycle through ALL working keys
    const currentIndex = this.keyIndex.get(provider) || 0;
    const keyIndex = currentIndex % workingKeys.length;
    const key = workingKeys[keyIndex];
    
    // Increment for next time
    this.keyIndex.set(provider, currentIndex + 1);
    
    console.log(`[Key Manager] Round-robin ${provider}: Key ${keyIndex + 1}/${workingKeys.length} (${key.slice(0, 15)}...) - Total: ${keys.length} keys`);
    return key;
  }

  static markKeyAsFailed(provider: string, failedKey: string): void {
    if (!this.failedKeys.has(provider)) {
      this.failedKeys.set(provider, new Set());
    }
    this.failedKeys.get(provider)!.add(failedKey);
    console.warn(`[AI Manager] Marked ${provider} key as failed: ${failedKey.slice(0, 10)}...`);
  }

  static resetFailedKeys(provider: string): void {
    this.failedKeys.delete(provider);
    console.log(`[AI Manager] Reset failed keys for ${provider}`);
  }

  static getKeyStatus(provider: string) {
    const total = this.getAvailableKeys(provider).length;
    const failed = this.failedKeys.get(provider)?.size || 0;
    const working = total - failed;
    
    console.log(`[Key Manager] ${provider} status: ${working}/${total} keys working (${failed} failed)`);
    return { total, failed, working };
  }
}

// ==========================================
// ERROR CLASSIFICATION
// ==========================================

class ErrorClassifier {
  static isRateLimitError(error: any): boolean {
    const errorStr = JSON.stringify(error).toLowerCase();
    return errorStr.includes('rate limit') || 
           errorStr.includes('quota') || 
           errorStr.includes('429') ||
           errorStr.includes('too many requests');
  }

  static isAuthError(error: any): boolean {
    const errorStr = JSON.stringify(error).toLowerCase();
    return errorStr.includes('unauthorized') || 
           errorStr.includes('invalid key') || 
           errorStr.includes('401') ||
           errorStr.includes('forbidden') ||
           errorStr.includes('403');
  }

  static isInsufficientCreditsError(error: any): boolean {
    const errorStr = JSON.stringify(error).toLowerCase();
    // OpenRouter and some providers use 402 or messages indicating not enough credits.
    return errorStr.includes('402') ||
      errorStr.includes('requires more credits') ||
      errorStr.includes('can only afford') ||
      errorStr.includes('prompt tokens limit exceeded') ||
      errorStr.includes('insufficient credits') ||
      errorStr.includes('payment required');
  }

  static isServerError(error: any): boolean {
    const errorStr = JSON.stringify(error).toLowerCase();
    return errorStr.includes('500') || 
           errorStr.includes('502') || 
           errorStr.includes('503') ||
           errorStr.includes('504') ||
           errorStr.includes('internal server error');
  }

  static shouldRetryWithSameProvider(error: any): boolean {
    return this.isServerError(error);
  }

  static shouldSwitchProvider(error: any): boolean {
    // Switch provider when the issue is unlikely to be fixed by trying more keys.
    // - Auth errors: key invalid
    // - Rate limits: try other provider if key rotation doesn't help
    // - Insufficient credits: provider/key is out of funds (common with OpenRouter 402)
    return this.isAuthError(error) || this.isRateLimitError(error) || this.isInsufficientCreditsError(error);
  }
}

// ==========================================
// UNIVERSAL AI MANAGER
// ==========================================

export class UniversalAIManager {
  private category: 'TEXT_GEN' | 'IMAGE_GEN' | 'TTS_GEN';
  private preferredProvider?: string;

  constructor(category: 'TEXT_GEN' | 'IMAGE_GEN' | 'TTS_GEN', preferredProvider?: string) {
    this.category = category;
    this.preferredProvider = preferredProvider;
  }

  private getProvidersInOrder(): string[] {
    const providers = PROVIDER_CATEGORIES[this.category];
    
    // Sort by priority (lower number = higher priority)
    const sortedProviders = providers
      .filter(p => PROVIDER_CONFIGS[p])
      .sort((a, b) => PROVIDER_CONFIGS[a].priority - PROVIDER_CONFIGS[b].priority);

    // If preferred provider is specified and available, put it first
    if (this.preferredProvider && sortedProviders.includes(this.preferredProvider)) {
      const filtered = sortedProviders.filter(p => p !== this.preferredProvider);
      return [this.preferredProvider, ...filtered];
    }

    return sortedProviders;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeWithFailover<T>(
    apiCall: (provider: string, apiKey: string, config: ProviderConfig) => Promise<T>,
    maxProviders: number = 5
  ): Promise<AIResponse<T>> {
    const startTime = Date.now();
    const providersAttempted: string[] = [];
    let totalAttempts = 0;
    let lastError: any = null;

    const providers = this.getProvidersInOrder().slice(0, maxProviders);

    console.log(`[AI Manager] Starting ${this.category} with ${providers.length} providers`);

    for (const provider of providers) {
      providersAttempted.push(provider);
      const config = PROVIDER_CONFIGS[provider];
      const keyStatus = KeyManager.getKeyStatus(provider);

      if (keyStatus.working === 0) {
        console.warn(`[AI Manager] Skipping ${provider} - no working keys (${keyStatus.failed}/${keyStatus.total} failed)`);
        continue;
      }

      // Try multiple keys for this provider - use more keys for better coverage
      const maxKeyAttempts = Math.min(keyStatus.working, 10); // Try up to 10 keys per provider instead of 5
      
      for (let keyAttempt = 0; keyAttempt < maxKeyAttempts; keyAttempt++) {
        totalAttempts++;
        const apiKey = KeyManager.getNextKey(provider, 'round-robin'); // Use round-robin for better distribution
        
        if (!apiKey) continue;

        try {
          console.log(`[AI Manager] Trying ${provider} key ${keyAttempt + 1}/${maxKeyAttempts} (Total: ${totalAttempts}) - Key: ${apiKey.slice(0, 15)}...`);
          
          const result = await apiCall(provider, apiKey, config);
          
          const executionTime = Date.now() - startTime;
          console.log(`[AI Manager] ✅ SUCCESS with ${provider} in ${executionTime}ms using key ${keyAttempt + 1}`);
          
          return {
            success: true,
            data: result,
            provider,
            keyUsed: `${apiKey.slice(0, 10)}...`,
            attempt: totalAttempts,
            executionTime,
            providersAttempted,
            totalAttempts
          };

        } catch (error: any) {
          lastError = error;
          console.error(`[AI Manager] ❌ ${provider} key ${keyAttempt + 1} failed:`, error.message);

          // Classify error and decide next action
          if (ErrorClassifier.isAuthError(error)) {
            KeyManager.markKeyAsFailed(provider, apiKey);
            console.log(`[AI Manager] 🔑 Auth error - trying next key for ${provider}`);
            // Try next key for same provider
            continue;
          }

          if (ErrorClassifier.isRateLimitError(error)) {
            console.log(`[AI Manager] ⏳ Rate limit hit for ${provider}, trying next key immediately`);
            // For rate limits, try next key immediately (don't wait)
            continue;
          }

          if (ErrorClassifier.isInsufficientCreditsError(error)) {
            // For providers like OpenRouter, 402 almost always means the key/account is out of credits.
            // Mark the key failed and immediately move on to the next provider to avoid burning time.
            KeyManager.markKeyAsFailed(provider, apiKey);
            console.log(`[AI Manager] 💳 Credits/quota issue - marking key failed and switching provider from ${provider}`);
            break;
          }

          if (ErrorClassifier.isServerError(error)) {
            console.log(`[AI Manager] 🖥️ Server error for ${provider}, trying next key in 1s`);
            await this.delay(1000);
            // Try next key for same provider
            continue;
          }

          // For other errors, try next key
          console.log(`[AI Manager] ❓ Other error for ${provider}, trying next key`);
          await this.delay(500);
          continue;
        }
      }
    }

    // All providers failed
    const executionTime = Date.now() - startTime;
    console.error(`[AI Manager] 💥 All providers failed after ${totalAttempts} attempts in ${executionTime}ms`);
    
    return {
      success: false,
      error: lastError?.message || 'All providers failed',
      providersAttempted,
      totalAttempts,
      executionTime
    };
  }

  // Static convenience methods
  static forTextGeneration(preferredProvider?: TextGenProvider): UniversalAIManager {
    return new UniversalAIManager('TEXT_GEN', preferredProvider);
  }

  static forImageGeneration(preferredProvider?: ImageGenProvider): UniversalAIManager {
    return new UniversalAIManager('IMAGE_GEN', preferredProvider);
  }

  static forTTS(preferredProvider?: TTSProvider): UniversalAIManager {
    return new UniversalAIManager('TTS_GEN', preferredProvider);
  }
}

// ==========================================
// CONVENIENCE FUNCTIONS
// ==========================================

export async function generateWithTextAI<T>(
  apiCall: (provider: string, apiKey: string, config: ProviderConfig) => Promise<T>,
  preferredProvider?: TextGenProvider
): Promise<AIResponse<T>> {
  const manager = UniversalAIManager.forTextGeneration(preferredProvider);
  return manager.executeWithFailover(apiCall);
}

export async function generateWithImageAI<T>(
  apiCall: (provider: string, apiKey: string, config: ProviderConfig) => Promise<T>,
  preferredProvider?: ImageGenProvider
): Promise<AIResponse<T>> {
  const manager = UniversalAIManager.forImageGeneration(preferredProvider);
  return manager.executeWithFailover(apiCall);
}

export async function generateWithTTSAI<T>(
  apiCall: (provider: string, apiKey: string, config: ProviderConfig) => Promise<T>,
  preferredProvider?: TTSProvider
): Promise<AIResponse<T>> {
  const manager = UniversalAIManager.forTTS(preferredProvider);
  return manager.executeWithFailover(apiCall);
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export function getProviderStatus() {
  const status: Record<string, any> = {};
  
  for (const [category, providers] of Object.entries(PROVIDER_CATEGORIES)) {
    status[category] = {};
    for (const provider of providers) {
      const keyStatus = KeyManager.getKeyStatus(provider);
      status[category][provider] = {
        ...keyStatus,
        config: PROVIDER_CONFIGS[provider]?.name || provider
      };
    }
  }
  
  // Log summary
  console.log('\n=== PROVIDER STATUS SUMMARY ===');
  for (const [category, providers] of Object.entries(status)) {
    console.log(`\n${category}:`);
    for (const [provider, info] of Object.entries(providers as Record<string, any>)) {
      const { total, working, failed } = info;
      console.log(`  ${provider}: ${working}/${total} keys working (${failed} failed)`);
    }
  }
  console.log('===============================\n');
  
  return status;
}

export function resetProviderKeys(provider: string) {
  KeyManager.resetFailedKeys(provider);
}

// Test all keys for a provider
export async function testAllKeysForProvider(provider: string): Promise<{
  provider: string;
  totalKeys: number;
  workingKeys: string[];
  failedKeys: string[];
  results: Array<{key: string; status: 'working' | 'failed'; error?: string}>;
}> {
  const keys = KeyManager.getAvailableKeys(provider);
  const results: Array<{key: string; status: 'working' | 'failed'; error?: string}> = [];
  const workingKeys: string[] = [];
  const failedKeys: string[] = [];
  
  console.log(`[Key Tester] Testing all ${keys.length} keys for ${provider}...`);
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const keyPreview = `${key.slice(0, 15)}...`;
    
    try {
      console.log(`[Key Tester] Testing ${provider} key ${i + 1}/${keys.length}: ${keyPreview}`);
      
      // Simple test call based on provider
      let testResult;
      if (provider === 'gemini') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello' }] }],
            generationConfig: { maxOutputTokens: 10 }
          })
        });
        testResult = response.ok;
      } else {
        // For OpenAI-compatible APIs
        const config = PROVIDER_CONFIGS[provider];
        if (!config) throw new Error('Provider not found');
        
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: config.models[0],
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 10
          })
        });
        testResult = response.ok;
      }
      
      if (testResult) {
        results.push({ key: keyPreview, status: 'working' });
        workingKeys.push(key);
        console.log(`[Key Tester] ✅ ${provider} key ${i + 1} working: ${keyPreview}`);
      } else {
        results.push({ key: keyPreview, status: 'failed', error: 'API call failed' });
        failedKeys.push(key);
        console.log(`[Key Tester] ❌ ${provider} key ${i + 1} failed: ${keyPreview}`);
      }
      
    } catch (error: any) {
      results.push({ key: keyPreview, status: 'failed', error: error.message });
      failedKeys.push(key);
      console.log(`[Key Tester] ❌ ${provider} key ${i + 1} failed: ${keyPreview} - ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`[Key Tester] ${provider} results: ${workingKeys.length}/${keys.length} keys working`);
  
  return {
    provider,
    totalKeys: keys.length,
    workingKeys,
    failedKeys,
    results
  };
}

export { PROVIDER_CONFIGS, PROVIDER_CATEGORIES };
// ==========================================
// CONVENIENCE AI MANAGER INSTANCES
// ==========================================

// Pre-configured instances for easy use
export const aiManager = {
  // Text generation with automatic failover
  async generateText(options: {
    messages: Array<{ role: string; content: string }>;
    maxTokens?: number;
    temperature?: number;
    preferredProvider?: TextGenProvider;
  }): Promise<AIResponse<string>> {
    return generateWithTextAI(async (provider, apiKey, config) => {
      // Import AI clients dynamically to avoid circular dependencies
      const { getGeminiWithKey, getGroq, getOpenAI, getCerebrasClient, getXAIClient, getDeepSeekClient, getGitHubModelsClient } = await import('./ai');
      
      switch (provider) {
        case 'openrouter':
          // Use OpenAI-compatible API for OpenRouter (more reliable)
          const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://toolkit-hub.vercel.app',
              'X-Title': 'Toolkit Hub'
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini",
              messages: options.messages,
              max_tokens: options.maxTokens || 1500,
              temperature: options.temperature || 0.8
            })
          });
          
          if (!openrouterResponse.ok) {
            throw new Error(`OpenRouter API error: ${openrouterResponse.status}`);
          }
          
          const openrouterData = await openrouterResponse.json();
          return openrouterData.choices[0].message.content || '';

        case 'cerebras':
          const cerebrasClient = getCerebrasClient();
          const cerebrasCompletion = await cerebrasClient.chat.completions.create({
            messages: options.messages,
            model: "llama3.1-8b",
            max_tokens: options.maxTokens || 1500,
            temperature: options.temperature || 0.8
          });
          return cerebrasCompletion.choices[0].message.content || '';

        case 'xai':
          const xaiClient = getXAIClient();
          const xaiCompletion = await xaiClient.chat.completions.create({
            messages: options.messages,
            model: "grok-2-latest",
            max_tokens: options.maxTokens || 1500,
            temperature: options.temperature || 0.8
          });
          return xaiCompletion.choices[0].message.content || '';

        case 'deepseek':
          const deepseekClient = getDeepSeekClient();
          const deepseekCompletion = await deepseekClient.chat.completions.create({
            messages: options.messages,
            model: "deepseek-chat",
            max_tokens: options.maxTokens || 1500,
            temperature: options.temperature || 0.8
          });
          return deepseekCompletion.choices[0].message.content || '';

        case 'github':
          const githubClient = getGitHubModelsClient();
          if (!githubClient) throw new Error('GitHub Models not available');
          const githubCompletion = await githubClient.chat.completions.create({
            messages: options.messages,
            model: "gpt-4o-mini",
            max_tokens: options.maxTokens || 1500,
            temperature: options.temperature || 0.8
          });
          return githubCompletion.choices[0].message.content || '';

        case 'groq':
          const groq = getGroq();
          const groqCompletion = await groq.chat.completions.create({
            messages: options.messages,
            model: "llama-3.3-70b-versatile",
            max_tokens: options.maxTokens || 1500,
            temperature: options.temperature || 0.8
          });
          return groqCompletion.choices[0].message.content || '';

        case 'gemini':
          const genAI = getGeminiWithKey(apiKey, config.baseUrl);
          const modelName = "gemini-1.5-flash-latest";
          const model = genAI.getGenerativeModel({ model: modelName });
          const systemMessage = options.messages.find(m => m.role === 'system')?.content || '';
          const userMessage = options.messages.find(m => m.role === 'user')?.content || '';
          const result = await model.generateContent([systemMessage, userMessage]);
          const response = result.response;
          return response.text();

        case 'openai':
          const openai = getOpenAI();
          const openaiCompletion = await openai.chat.completions.create({
            messages: options.messages,
            model: "gpt-4o",
            max_tokens: options.maxTokens || 1500,
            temperature: options.temperature || 0.8
          });
          return openaiCompletion.choices[0].message.content || '';

        case 'anthropic':
          const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: options.maxTokens || 1500,
              messages: options.messages.filter(m => m.role !== 'system'),
              system: options.messages.find(m => m.role === 'system')?.content || ''
            })
          });
          if (!anthropicResponse.ok) throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
          const anthropicData = await anthropicResponse.json();
          return anthropicData.content[0].text || '';

        case 'perplexity':
          const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'llama-3.1-sonar-small-128k-online',
              messages: options.messages,
              max_tokens: options.maxTokens || 1500,
              temperature: options.temperature || 0.8
            })
          });
          if (!perplexityResponse.ok) throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
          const perplexityData = await perplexityResponse.json();
          return perplexityData.choices[0].message.content || '';

        case 'together':
          const togetherResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'meta-llama/Llama-3-8b-chat-hf',
              messages: options.messages,
              max_tokens: options.maxTokens || 1500,
              temperature: options.temperature || 0.8
            })
          });
          if (!togetherResponse.ok) throw new Error(`Together AI error: ${togetherResponse.status}`);
          const togetherData = await togetherResponse.json();
          return togetherData.choices[0].message.content || '';

        case 'mistral':
          const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'mistral-large-latest',
              messages: options.messages,
              max_tokens: options.maxTokens || 1500,
              temperature: options.temperature || 0.8
            })
          });
          if (!mistralResponse.ok) throw new Error(`Mistral API error: ${mistralResponse.status}`);
          const mistralData = await mistralResponse.json();
          return mistralData.choices[0].message.content || '';

        case 'huggingface':
          const hfResponse = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              inputs: options.messages[options.messages.length - 1].content,
              parameters: {
                max_length: options.maxTokens || 1500,
                temperature: options.temperature || 0.8
              }
            })
          });
          if (!hfResponse.ok) throw new Error(`Hugging Face API error: ${hfResponse.status}`);
          const hfData = await hfResponse.json();
          return hfData[0]?.generated_text || '';

        case 'cohere':
          const cohereResponse = await fetch('https://api.cohere.ai/v1/generate', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'command-r-plus',
              prompt: options.messages.map(m => `${m.role}: ${m.content}`).join('\n'),
              max_tokens: options.maxTokens || 1500,
              temperature: options.temperature || 0.8
            })
          });
          if (!cohereResponse.ok) throw new Error(`Cohere API error: ${cohereResponse.status}`);
          const cohereData = await cohereResponse.json();
          return cohereData.generations[0].text || '';

        case 'gigachat':
          const gigachatResponse = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'GigaChat',
              messages: options.messages,
              max_tokens: options.maxTokens || 1500,
              temperature: options.temperature || 0.8
            })
          });
          if (!gigachatResponse.ok) throw new Error(`GigaChat API error: ${gigachatResponse.status}`);
          const gigachatData = await gigachatResponse.json();
          return gigachatData.choices[0].message.content || '';

        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    }, options.preferredProvider);
  },

  // Image generation with automatic failover
  async generateImage(options: {
    prompt: string;
    width?: number;
    height?: number;
    preferredProvider?: ImageGenProvider;
  }): Promise<AIResponse<{ imageUrl: string; revisedPrompt?: string }>> {
    return generateWithImageAI(async (provider, apiKey, config) => {
      // Import functions dynamically
      const { getRandomStabilityKey, getRandomDeapiKey } = await import('./api-keys');
      
      switch (provider) {
        case 'stability':
          const stabilityKey = getRandomStabilityKey();
          if (!stabilityKey) throw new Error('Stability AI key not available');
          
          const stabilityResponse = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stabilityKey}`,
              'Accept': 'application/json',
            },
            body: new URLSearchParams({
              prompt: options.prompt,
              mode: 'text-to-image',
              aspect_ratio: '1:1',
              output_format: 'png'
            }),
          });

          if (!stabilityResponse.ok) {
            throw new Error(`Stability AI error: ${stabilityResponse.status}`);
          }

          const stabilityData = await stabilityResponse.json();
          return {
            imageUrl: stabilityData.image || stabilityData.artifacts?.[0]?.base64 ? 
              `data:image/png;base64,${stabilityData.artifacts[0].base64}` : '',
            revisedPrompt: options.prompt
          };

        case 'deapi':
          const deapiKey = getRandomDeapiKey();
          if (!deapiKey) throw new Error('DEAPI key not available');
          
          const deapiResponse = await fetch('https://api.deapi.ai/api/v1/client/txt2img', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${deapiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: options.prompt,
              model: 'flux-1.1-pro',
              width: options.width || 1024,
              height: options.height || 1024,
              steps: 20,
              guidance_scale: 7.5
            }),
          });

          if (!deapiResponse.ok) {
            throw new Error(`DEAPI error: ${deapiResponse.status}`);
          }

          const deapiData = await deapiResponse.json();
          return {
            imageUrl: deapiData.image_url || deapiData.data?.image_url || '',
            revisedPrompt: options.prompt
          };

        case 'replicate':
          const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
              'Authorization': `Token ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              version: "black-forest-labs/flux-schnell",
              input: {
                prompt: options.prompt,
                width: options.width || 1024,
                height: options.height || 1024,
                num_outputs: 1
              }
            }),
          });

          if (!replicateResponse.ok) {
            throw new Error(`Replicate error: ${replicateResponse.status}`);
          }

          const replicateData = await replicateResponse.json();
          // Replicate returns a prediction that needs to be polled
          return {
            imageUrl: replicateData.urls?.get || '',
            revisedPrompt: options.prompt
          };

        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    }, options.preferredProvider);
  },

  // TTS generation with automatic failover
  async generateTTS(options: {
    text: string;
    voice?: string;
    preferredProvider?: TTSProvider;
  }): Promise<AIResponse<{ audioUrl: string }>> {
    return generateWithTTSAI(async (provider, apiKey, config) => {
      // Import functions dynamically
      const { getRandomElevenLabsKey, getRandomDeapiKey } = await import('./api-keys');
      
      switch (provider) {
        case 'elevenlabs':
          const elevenLabsKey = getRandomElevenLabsKey();
          if (!elevenLabsKey) throw new Error('ElevenLabs key not available');
          
          const voiceId = options.voice || 'pNInz6obpgDQGcFmaJgB'; // Default voice
          const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${elevenLabsKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: options.text,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
              }
            }),
          });

          if (!elevenLabsResponse.ok) {
            throw new Error(`ElevenLabs error: ${elevenLabsResponse.status}`);
          }

          const audioBuffer = await elevenLabsResponse.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString('base64');
          return {
            audioUrl: `data:audio/mpeg;base64,${base64Audio}`
          };

        case 'deapi':
          const deapiKey = getRandomDeapiKey();
          if (!deapiKey) throw new Error('DEAPI key not available');
          
          const deapiResponse = await fetch('https://api.deapi.ai/api/v1/client/tts', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${deapiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: options.text,
              voice: options.voice || 'en-US-AriaNeural',
              speed: 1.0,
              pitch: 1.0
            }),
          });

          if (!deapiResponse.ok) {
            throw new Error(`DEAPI TTS error: ${deapiResponse.status}`);
          }

          const deapiData = await deapiResponse.json();
          return {
            audioUrl: deapiData.audio_url || deapiData.data?.audio_url || ''
          };

        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    }, options.preferredProvider);
  }
};

// Export default instance for backward compatibility
export default aiManager;