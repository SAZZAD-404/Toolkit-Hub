import { NextRequest, NextResponse } from 'next/server';
import { generateWithImageAI, ImageGenProvider, ProviderConfig } from '@/lib/ai-manager';
import { checkCredits, logUsageAndCharge } from '@/lib/usage';
import { creditsForTool } from '@/lib/credits';

// Universal image generation function
async function callImageProvider(
  provider: string,
  apiKey: string,
  config: ProviderConfig,
  prompt: string,
  style: string
): Promise<{ imageUrl: string; revisedPrompt: string }> {
  const styleModifiers: Record<string, string> = {
    'Realistic': 'natural photography, authentic, real life, genuine, unfiltered',
    'Anime': 'anime style, vibrant colors, detailed anime art',
    'Digital Art': 'digital art, vibrant, detailed illustration',
    'Oil Painting': 'oil painting style, classical art, rich textures',
    'Watercolor': 'watercolor painting, soft colors, artistic',
    'Sketch': 'pencil sketch, detailed drawing, black and white',
    '3D Render': '3D render, high quality, realistic lighting',
    'Pixel Art': 'pixel art style, 16-bit, retro game art',
  };

  const enhancedPrompt = `${prompt}, ${styleModifiers[style] || styleModifiers['Digital Art']}`;

  switch (provider) {
    case 'stability':
      return await generateWithStability(apiKey, enhancedPrompt);
    
    case 'a4f':
      return await generateWithA4F(apiKey, enhancedPrompt);
    
    case 'deapi':
      return await generateWithDeapi(apiKey, enhancedPrompt);
    
    default:
      throw new Error(`Unsupported image provider: ${provider}`);
  }
}

// Stability AI implementation
async function generateWithStability(apiKey: string, prompt: string): Promise<{ imageUrl: string; revisedPrompt: string }> {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('model', 'sd3-large');
  formData.append('width', '1024');
  formData.append('height', '1024');
  formData.append('steps', '30');
  formData.append('cfg_scale', '7.5');
  formData.append('output_format', 'png');

  const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'image/*',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stability AI error: ${response.status} - ${errorText}`);
  }

  // Check if response is an image
  const contentType = response.headers.get('content-type');
  if (contentType?.startsWith('image/')) {
    // Response is an image, convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const imageUrl = `data:${contentType};base64,${base64}`;
    return { imageUrl, revisedPrompt: prompt };
  } else {
    // Response is JSON
    const data = await response.json();
    const imageBase64 = data.image;
    const imageUrl = `data:image/png;base64,${imageBase64}`;
    return { imageUrl, revisedPrompt: prompt };
  }
}

// A4F implementation
async function generateWithA4F(apiKey: string, prompt: string): Promise<{ imageUrl: string; revisedPrompt: string }> {
  const response = await fetch('https://api.a4f.co/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      model: 'provider-4/imagen-4',
      width: 1024,
      height: 1024,
      n: 1
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`A4F API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const imageUrl = data.data?.[0]?.url || data.url;

  if (!imageUrl) {
    throw new Error('No image URL in A4F response');
  }

  return { imageUrl, revisedPrompt: prompt };
}

// DEAPI implementation
async function generateWithDeapi(apiKey: string, prompt: string): Promise<{ imageUrl: string; revisedPrompt: string }> {
  const response = await fetch('https://api.deapi.ai/api/v1/client/txt2img', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: 'blur, noise, low quality, distorted',
      model: 'Flux1schnell',
      width: 1024,
      height: 1024,
      guidance: 7.5,
      steps: 4,
      seed: Math.floor(Math.random() * 2147483647),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error('DEAPI service unavailable');
    }

    let errorMessage = `API error: ${response.status}`;
    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // keep default error message
    }
    throw new Error(errorMessage);
  }

  const responseText = await response.text();
  if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
    throw new Error('DEAPI service unavailable');
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error('Invalid response from DEAPI');
  }

  let imageUrl = data.image || data.url || data.result?.url || data.output || data.data?.image;

  // Handle async processing with request_id
  if (data.data?.request_id || data.request_id) {
    const jobId = data.data?.request_id || data.request_id;
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusResponse = await fetch(`https://api.deapi.ai/api/v1/client/request-status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const status = statusData.data?.status || statusData.status;

        if (status === 'done' || status === 'completed' || status === 'success') {
          imageUrl = statusData.data?.result_url || statusData.data?.image || statusData.image || statusData.url || statusData.result?.url || statusData.output;
          break;
        } else if (status === 'failed' || status === 'error') {
          throw new Error(statusData.error || statusData.data?.error || 'Image generation failed');
        }
      }
      attempts++;
    }

    if (!imageUrl) {
      throw new Error('Image generation timed out');
    }
  }

  if (!imageUrl) {
    throw new Error('No image URL in response');
  }

  return { imageUrl, revisedPrompt: prompt };
}

export async function POST(request: NextRequest) {
  const tool = 'generate-image';
  try {
    const { prompt, style, preferredProvider } = await request.json();

    const chk = await checkCredits({ req: request, tool });
    if (!chk.ok) {
      return NextResponse.json({ error: chk.error, creditsNeeded: chk.creditsNeeded, remaining: chk.remaining }, { status: chk.status });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Use Universal AI Manager for image generation with automatic failover
    const result = await generateWithImageAI(
      async (provider, apiKey, config) => {
        return await callImageProvider(provider, apiKey, config, prompt, style);
      },
      preferredProvider as ImageGenProvider
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error,
        providersAttempted: result.providersAttempted,
        totalAttempts: result.totalAttempts
      }, { status: 500 });
    }

    await logUsageAndCharge({ req: request, tool, status: 'success', credits: creditsForTool(tool), meta: { style } });

    return NextResponse.json({
      imageUrl: result.data!.imageUrl,
      revisedPrompt: result.data!.revisedPrompt,
      success: true,
      metadata: {
        provider: result.provider,
        executionTime: result.executionTime,
        totalAttempts: result.totalAttempts
      }
    });

  } catch (error: unknown) {
    console.error('Image generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
    await logUsageAndCharge({ req: request, tool: 'generate-image', status: 'error', credits: 0, meta: { message: errorMessage } });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Image Generator API with Universal Failover',
    primaryProvider: 'Stability AI',
    fallbackProviders: ['A4F', 'DEAPI'],
    supportedStyles: [
      'Realistic', 'Anime', 'Digital Art', 'Oil Painting', 
      'Watercolor', 'Sketch', '3D Render', 'Pixel Art'
    ],
    endpoints: {
      POST: 'Generate image from text prompt with automatic provider failover'
    }
  });
}