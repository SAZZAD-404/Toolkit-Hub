import { NextRequest, NextResponse } from 'next/server';
import { generateWithTTSAI, TTSProvider, ProviderConfig } from '@/lib/ai-manager';
import { checkCredits, logUsageAndCharge } from '@/lib/usage';
import { creditsForTool } from '@/lib/credits';

// Available voices for DEAPI Kokoro model
const AVAILABLE_VOICES = [
  'af_alloy', 'af_echo', 'af_fable', 'af_onyx', 'af_nova', 'af_shimmer',
  'af_sky', 'am_adam', 'am_liam', 'am_ryan', 'bf_charlotte', 'bf_jessica',
  'bf_sarah', 'bm_andrew', 'bm_brian', 'bm_christopher'
];

// ElevenLabs voice mapping
const ELEVENLABS_VOICES: Record<string, string> = {
  'af_sky': 'pNInz6obpgDQGcFmaJgB', // Adam
  'af_alloy': '21m00Tcm4TlvDq8ikWAM', // Rachel
  'af_nova': 'AZnzlk1XvdvUeBnXmlld', // Domi
  'af_shimmer': 'EXAVITQu4vr4xnSDxMaL', // Bella
  'af_onyx': 'VR6AewLTigWG4xSOukaG', // Josh
  'af_echo': 'pqHfZKP75CvOlQylNhV4', // Bill
};

// Universal TTS generation function
async function callTTSProvider(
  provider: string,
  apiKey: string,
  config: ProviderConfig,
  text: string,
  voice: string,
  language: string,
  speed: number
): Promise<{ audio: string; provider: string; voice: string; format: string }> {
  switch (provider) {
    case 'elevenlabs':
      return await generateWithElevenLabs(apiKey, text, voice);
    
    case 'deapi':
      return await generateWithDeapi(apiKey, text, voice, language, speed);
    
    default:
      throw new Error(`Unsupported TTS provider: ${provider}`);
  }
}

// ElevenLabs TTS implementation
async function generateWithElevenLabs(
  apiKey: string, 
  text: string, 
  voice: string
): Promise<{ audio: string; provider: string; voice: string; format: string }> {
  const voiceId = ELEVENLABS_VOICES[voice] || ELEVENLABS_VOICES['af_sky'];
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0,
        use_speaker_boost: true
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString('base64');
  
  return {
    audio: base64Audio,
    provider: 'elevenlabs',
    voice,
    format: 'mp3'
  };
}

// DEAPI TTS implementation
async function generateWithDeapi(
  apiKey: string,
  text: string,
  voice: string,
  language: string,
  speed: number
): Promise<{ audio: string; provider: string; voice: string; format: string }> {
  const response = await fetch('https://api.deapi.ai/api/v1/client/txt2audio', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      text: text.trim(),
      model: 'Kokoro',
      voice,
      lang: language || 'en-us',
      speed,
      format: 'mp3',
      sample_rate: 24000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API error: ${response.status}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Keep default error message
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  // Check for direct audio response
  if (data.audio_url || data.url) {
    const audioUrl = data.audio_url || data.url;
    try {
      const audioResponse = await fetch(audioUrl);
      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      const base64Audio = audioBuffer.toString('base64');
      
      return {
        audio: base64Audio,
        provider: 'deapi',
        voice,
        format: 'mp3'
      };
    } catch (fetchError) {
      console.error('Failed to fetch audio from URL:', fetchError);
      throw new Error('Failed to download generated audio');
    }
  }
  
  // Handle async processing with request_id
  const requestId = data.data?.request_id || data.request_id;
  if (requestId) {
    const result = await pollForResult(requestId, apiKey);
    
    // Extract audio URL from result
    const audioUrl = result.data?.result_url || result.result_url || 
                    result.data?.audio_url || result.audio_url || 
                    result.data?.url || result.url;
    
    if (audioUrl) {
      try {
        const audioResponse = await fetch(audioUrl);
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        const base64Audio = audioBuffer.toString('base64');
        
        return {
          audio: base64Audio,
          provider: 'deapi',
          voice,
          format: 'mp3'
        };
      } catch (fetchError) {
        console.error('Failed to fetch audio from polling result:', fetchError);
        throw new Error('Failed to download generated audio');
      }
    }
    
    // Check for direct base64 audio data
    const audioData = result.data?.audio || result.audio || result.data?.data;
    if (audioData) {
      return {
        audio: audioData,
        provider: 'deapi',
        voice,
        format: 'mp3'
      };
    }
    
    throw new Error('No audio data found in result');
  }
  
  // Handle direct base64 response
  if (data.audio) {
    return {
      audio: data.audio,
      provider: 'deapi',
      voice,
      format: 'mp3'
    };
  }
  
  throw new Error('No audio data or request ID in response');
}

// Polling function for DEAPI async processing
async function pollForResult(requestId: string, apiKey: string, maxAttempts = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const statusResponse = await fetch(`https://api.deapi.ai/api/v1/client/request-status/${requestId}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (statusResponse.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      continue;
    }

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    
    if (statusData.message === 'Too Many Attempts.') {
      await new Promise(resolve => setTimeout(resolve, 5000));
      continue;
    }
    
    const status = statusData.data?.status || statusData.status;
    
    if (status === 'done' || status === 'completed' || status === 'success') {
      return statusData;
    } else if (status === 'error' || status === 'failed') {
      throw new Error(statusData.data?.error || statusData.error || 'Audio generation failed');
    }
  }
  
  throw new Error('Timeout waiting for audio generation');
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const tool = 'tts';
  try {
    const { text, voice, language, speed, preferredProvider } = await request.json();

    const chk = await checkCredits({ req: request, tool });
    if (!chk.ok) {
      return NextResponse.json({ error: chk.error, creditsNeeded: chk.creditsNeeded, remaining: chk.remaining }, { status: chk.status });
    }

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Validate and set voice
    const selectedVoice = AVAILABLE_VOICES.includes(voice) ? voice : 'af_alloy';
    
    // Validate speed (0.5 to 2.0)
    const validSpeed = Math.max(0.5, Math.min(2.0, speed || 1.0));

    // Use Universal AI Manager for TTS generation with automatic failover
    const result = await generateWithTTSAI(
      async (provider, apiKey, config) => {
        return await callTTSProvider(provider, apiKey, config, text.trim(), selectedVoice, language, validSpeed);
      },
      preferredProvider as TTSProvider
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error,
        providersAttempted: result.providersAttempted,
        totalAttempts: result.totalAttempts,
        availableVoices: AVAILABLE_VOICES
      }, { status: 500 });
    }

    await logUsageAndCharge({ req: request, tool, status: 'success', credits: creditsForTool(tool), meta: { chars: text.trim().length } });

    return NextResponse.json({
      success: true,
      audioUrl: `data:audio/mpeg;base64,${result.data!.audio}`,
      audio: result.data!.audio,
      provider: result.data!.provider,
      voice: result.data!.voice,
      format: result.data!.format,
      metadata: {
        executionTime: result.executionTime,
        totalAttempts: result.totalAttempts
      }
    });

  } catch (error: any) {
    console.error('TTS API error:', error);
    await logUsageAndCharge({ req: request, tool, status: 'error', credits: 0, meta: { message: error?.message } });
    
    return NextResponse.json({ 
      error: error?.message || 'Failed to generate speech',
      availableVoices: AVAILABLE_VOICES
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Text-to-Speech API with Universal Failover',
    primaryProvider: 'ElevenLabs',
    fallbackProvider: 'DEAPI Kokoro',
    availableVoices: AVAILABLE_VOICES,
    elevenlabsVoices: Object.keys(ELEVENLABS_VOICES),
    supportedLanguages: ['en-us', 'en-gb', 'es-es', 'fr-fr', 'de-de', 'it-it', 'pt-br', 'ru-ru', 'ja-jp', 'ko-kr', 'zh-cn'],
    speedRange: { min: 0.5, max: 2.0 },
    format: 'mp3',
    sampleRate: 24000,
    usage: {
      POST: 'Send text, optional voice, language, speed, and preferredProvider'
    }
  });
}