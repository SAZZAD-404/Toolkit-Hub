import { NextRequest, NextResponse } from 'next/server';
import { getRandomDeapiKey } from '@/lib/api-keys';
import { checkCredits, logUsageAndCharge } from '@/lib/usage';
import { creditsForTool } from '@/lib/credits';

export const maxDuration = 300;

async function pollForResult(requestId: string, apiKey: string, maxAttempts = 120): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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
      throw new Error(statusData.data?.error || statusData.error || 'Video generation failed');
    }
  }
  
  throw new Error('Timeout waiting for video generation');
}

export async function POST(request: NextRequest) {
  const tool = 'image-to-video';
  try {
    const { image, prompt, width, height, frames, fps, steps } = await request.json();

    const chk = await checkCredits({ req: request, tool });
    if (!chk.ok) {
      return NextResponse.json({ error: chk.error, creditsNeeded: chk.creditsNeeded, remaining: chk.remaining }, { status: chk.status });
    }

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const apiKey = getRandomDeapiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'DEAPI key not configured' }, { status: 500 });
    }

    // Validate and set parameters
    const videoWidth = Math.min(Math.max(width || 512, 256), 1024);
    const videoHeight = Math.min(Math.max(height || 512, 256), 1024);
    const videoFrames = Math.min(Math.max(frames || 120, 30), 240);
    const videoFps = Math.min(Math.max(fps || 30, 15), 60);
    const videoSteps = Math.min(Math.max(steps || 1, 1), 10);

    let imageBlob: Blob;
    let imageName = 'image.png';
    
    if (image.startsWith('data:')) {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      const binaryData = Buffer.from(base64Data, 'base64');
      imageBlob = new Blob([binaryData], { type: mimeType });
      imageName = mimeType === 'image/jpeg' ? 'image.jpg' : 'image.png';
    } else if (typeof image === 'string' && image.length > 100) {
      // Assume it's base64 without data URL prefix
      const binaryData = Buffer.from(image, 'base64');
      imageBlob = new Blob([binaryData], { type: 'image/png' });
    } else {
      return NextResponse.json({ error: 'Invalid image format. Please provide base64 or data URL.' }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('first_frame_image', imageBlob, imageName);
    formData.append('model', 'Ltxv_13B_0_9_8_Distilled_FP8');
    formData.append('prompt', prompt || 'Animate this image with smooth natural movement');
    formData.append('negative_prompt', 'blurry, distorted, low quality, static, frozen');
    formData.append('width', videoWidth.toString());
    formData.append('height', videoHeight.toString());
    formData.append('frames', videoFrames.toString());
    formData.append('fps', videoFps.toString());
    formData.append('steps', videoSteps.toString());
    formData.append('guidance', '7.5');
    formData.append('seed', String(Math.floor(Math.random() * 2147483647)));
    formData.append('return_result_in_response', 'false'); // Use async processing

    const response = await fetch('https://api.deapi.ai/api/v1/client/img2video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
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

    // Check for direct video response
    if (data.video_url || data.url) {
      await logUsageAndCharge({ req: request, tool, status: 'success', credits: creditsForTool(tool), meta: { frames: videoFrames, fps: videoFps } });
      return NextResponse.json({ 
        success: true, 
        videoUrl: data.video_url || data.url,
        duration: videoFrames / videoFps,
        resolution: `${videoWidth}x${videoHeight}`,
        fps: videoFps
      });
    }

    // Handle async processing with request_id
    const requestId = data.data?.request_id || data.request_id;
    if (requestId) {
      const result = await pollForResult(requestId, apiKey);
      
      // Extract video URL from result
      const videoUrl = result.data?.result_url || result.result_url || 
                      result.data?.video_url || result.video_url || 
                      result.data?.url || result.url;
      
      if (videoUrl) {
        await logUsageAndCharge({ req: request, tool, status: 'success', credits: creditsForTool(tool), meta: { frames: videoFrames, fps: videoFps } });
        return NextResponse.json({ 
          success: true, 
          videoUrl: videoUrl,
          duration: videoFrames / videoFps,
          resolution: `${videoWidth}x${videoHeight}`,
          fps: videoFps
        });
      }
      
      throw new Error('No video URL found in result');
    }

    throw new Error('No video URL or request ID in response');

  } catch (error: any) {
    console.error('Image to Video error:', error);
    await logUsageAndCharge({ req: request, tool: 'image-to-video', status: 'error', credits: 0, meta: { message: error?.message } });
    return NextResponse.json({ 
      error: error?.message || 'Failed to generate video'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Image-to-Video Generation API',
    model: 'Ltxv_13B_0_9_8_Distilled_FP8',
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    outputFormat: 'mp4',
    parameters: {
      width: { min: 256, max: 1024, default: 512 },
      height: { min: 256, max: 1024, default: 512 },
      frames: { min: 30, max: 240, default: 120 },
      fps: { min: 15, max: 60, default: 30 },
      steps: { min: 1, max: 10, default: 1 }
    },
    features: {
      maxDuration: '8 seconds (240 frames at 30fps)',
      guidance: 'Automatic guidance scale of 7.5',
      negativePrompt: 'Automatic quality enhancement'
    },
    usage: {
      POST: 'Send image (base64 or data URL) and optional parameters'
    }
  });
}