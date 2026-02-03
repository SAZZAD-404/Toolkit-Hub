import { NextRequest, NextResponse } from 'next/server';

// Simple API key validation without making actual calls
export async function GET(request: NextRequest) {
  try {
    const envKeys = {
      gemini: {
        keys: [
          process.env.GEMINI_API_KEY,
          process.env.GEMINI_API_KEY_1,
          process.env.GEMINI_API_KEY_2,
          process.env.GEMINI_API_KEY_3,
          process.env.GEMINI_API_KEY_4,
        ].filter(Boolean),
        format: 'Should start with "AIza" and be 39 characters long'
      },
      groq: {
        keys: [
          process.env.GROQ_API_KEY,
          process.env.GROQ_API_KEY_1,
          process.env.GROQ_API_KEY_2,
          process.env.GROQ_API_KEY_3,
          process.env.GROQ_API_KEY_4,
        ].filter(Boolean),
        format: 'Should start with "gsk_" and be around 56 characters'
      },
      openai: {
        keys: [
          process.env.OPENAI_API_KEY,
          process.env.OPENAI_API_KEY_1,
          process.env.OPENAI_API_KEY_2,
          process.env.OPENAI_API_KEY_3,
          process.env.OPENAI_API_KEY_4,
        ].filter(Boolean),
        format: 'Should start with "sk-" and be around 51 characters'
      },
      openrouter: {
        keys: [
          process.env.OPENROUTER_API_KEY,
          process.env.OPENROUTER_API_KEY_1,
          process.env.OPENROUTER_API_KEY_2,
        ].filter(Boolean),
        format: 'Should start with "sk-or-" and be around 48 characters'
      },
      github: {
        keys: [
          process.env.GITHUB_TOKEN,
          process.env.GITHUB_TOKEN_1,
          process.env.GITHUB_TOKEN_2,
        ].filter(Boolean),
        format: 'GitHub personal access token (github_pat_...)'
      },
      cerebras: {
        keys: [
          process.env.CEREBRAS_API_KEY,
          process.env.CEREBRAS_API_KEY_1,
        ].filter(Boolean),
        format: 'Should start with "csk-" for Cerebras API'
      },
      deapi: {
        keys: [
          process.env.DEAPI_API_KEY,
          process.env.DEAPI_API_KEY_1,
          process.env.DEAPI_API_KEY_2,
          process.env.DEAPI_API_KEY_3,
          process.env.DEAPI_API_KEY_4,
        ].filter(Boolean),
        format: 'Deapi API key format'
      }
    };

    const validation = Object.entries(envKeys).map(([provider, data]) => {
      const validKeys = data.keys.filter(key => key && key.length > 10);
      
      return {
        provider,
        totalKeys: data.keys.length,
        validFormatKeys: validKeys.length,
        hasKeys: validKeys.length > 0,
        format: data.format,
        keyPreviews: validKeys.map(key => key ? `${key.slice(0, 8)}...${key.slice(-4)}` : 'Invalid key')
      };
    });

    const recommendations = [];
    
    if (validation.every(p => !p.hasKeys)) {
      recommendations.push("⚠️ No valid API keys found! Add at least one working API key.");
    }
    
    const workingProviders = validation.filter(p => p.hasKeys);
    if (workingProviders.length < 2) {
      recommendations.push("💡 Add multiple providers for better reliability.");
    }
    
    workingProviders.forEach(provider => {
      if (provider.validFormatKeys === 1) {
        recommendations.push(`🔑 Add more ${provider.provider} keys for failover protection.`);
      }
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      providers: validation,
      totalWorkingProviders: workingProviders.length,
      recommendations,
      setupGuide: {
        gemini: "Get free API key from https://aistudio.google.com/app/apikey",
        groq: "Get free API key from https://console.groq.com/keys",
        openai: "Get API key from https://platform.openai.com/api-keys (requires payment)",
        openrouter: "Get API key from https://openrouter.ai/keys (pay-per-use)",
        github: "Get free access at https://github.com/marketplace/models",
        cerebras: "Get API key from https://cloud.cerebras.ai/ (fast inference)",
        deapi: "Get API key from https://deapi.ai/ (Flux AI access)"
      }
    });

  } catch (error: any) {
    console.error('Key validation failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Key validation failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}