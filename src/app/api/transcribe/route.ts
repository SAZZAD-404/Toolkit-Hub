import { NextRequest, NextResponse } from 'next/server';
import { getRandomDeapiKey } from '@/lib/api-keys';

export const maxDuration = 300; // 5 minutes timeout for large files

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
      throw new Error(statusData.data?.error || statusData.error || 'Video transcription failed');
    }
  }
  
  throw new Error('Timeout waiting for video transcription');
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    let videoFile: File | null = null;
    let includeTimestamps = false;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      videoFile = formData.get('video') as File;
      includeTimestamps = formData.get('include_timestamps') === 'true';

      if (!videoFile) {
        return NextResponse.json({ error: 'Video file is required' }, { status: 400 });
      }

      const maxSize = 100 * 1024 * 1024; // 100MB
      if (videoFile.size > maxSize) {
        return NextResponse.json({ error: 'File size exceeds 100MB limit' }, { status: 400 });
      }
    } else {
      // Handle JSON with video URL (not supported by DEAPI vid2txt currently)
      return NextResponse.json({ 
        error: 'Video URL transcription not available. Please upload a video file instead.' 
      }, { status: 400 });
    }

    // Try multiple DEAPI keys with proper error handling
    const deapiKeys = [
      process.env.DEAPI_API_KEY_1,
      process.env.DEAPI_API_KEY_2,
      process.env.DEAPI_API_KEY_3,
      process.env.DEAPI_API_KEY_4,
      process.env.DEAPI_API_KEY
    ].filter(Boolean) as string[];

    if (deapiKeys.length === 0) {
      return NextResponse.json({ 
        error: 'DEAPI key not configured',
        details: {
          totalAttempts: 0,
          providers: 0,
          keyErrors: 1,
          rateLimitErrors: 0,
          serverErrors: 0
        }
      }, { status: 500 });
    }

    let lastError: any = null;
    let totalAttempts = 0;

    // Try each DEAPI key
    for (const apiKey of deapiKeys) {
      totalAttempts++;
      
      try {
        console.log(`[Transcription] Trying DEAPI key ${totalAttempts}/${deapiKeys.length}`);

        // Create FormData for DEAPI
        const formData = new FormData();
        formData.append('video', videoFile, videoFile.name);
        formData.append('model', 'WhisperLargeV3');
        formData.append('include_ts', includeTimestamps.toString());
        formData.append('return_result_in_response', 'true'); // Get immediate response

        const response = await fetch('https://api.deapi.ai/api/v1/client/vid2txt', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `DEAPI error: ${response.status}`;
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // Keep default error message
          }
          
          // Check if it's a rate limit or auth error
          if (response.status === 429) {
            console.log(`[Transcription] Rate limit hit, trying next key`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          if (response.status === 401 || response.status === 403) {
            console.log(`[Transcription] Auth error, trying next key`);
            continue;
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // Check for immediate transcription response (return_result_in_response: true)
        if (data.text || data.transcription || data.result) {
          const text = data.text || data.transcription || data.result;
          return NextResponse.json({
            success: true,
            text: text,
            segments: data.segments || [],
            duration: data.duration || null,
            provider: 'DEAPI',
            attempts: totalAttempts
          });
        }
        
        // Handle async processing with request_id (fallback)
        const requestId = data.data?.request_id || data.request_id;
        if (requestId) {
          console.log(`[Transcription] Using async processing with request ID: ${requestId}`);
          const result = await pollForResult(requestId, apiKey);
          
          // Extract transcription from result
          const text = result.data?.result || result.result || 
                      result.data?.text || result.text ||
                      result.data?.transcription || result.transcription;
          
          const segments = result.data?.segments || result.segments || [];
          const duration = result.data?.duration || result.duration || null;
          
          if (text) {
            return NextResponse.json({
              success: true,
              text: text,
              segments: segments,
              duration: duration,
              provider: 'DEAPI',
              attempts: totalAttempts
            });
          }
          
          throw new Error('No transcription found in result');
        }
        
        throw new Error('No transcription or request ID in response');

      } catch (error: any) {
        lastError = error;
        console.error(`[Transcription] DEAPI key ${totalAttempts} failed:`, error.message);
        
        // If it's the last key, don't continue
        if (totalAttempts === deapiKeys.length) {
          break;
        }
        
        // Wait before trying next key
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // All keys failed
    console.error(`[Transcription] All ${deapiKeys.length} DEAPI keys failed`);
    
    return NextResponse.json({ 
      error: 'Generation Failed - All AI providers encountered issues',
      details: {
        totalAttempts,
        providers: 1,
        keyErrors: totalAttempts,
        rateLimitErrors: 0,
        serverErrors: 0
      }
    }, { status: 500 });

  } catch (error: any) {
    console.error('Video transcription error:', error);
    
    return NextResponse.json({ 
      error: error?.message || 'Failed to transcribe video',
      details: {
        totalAttempts: 1,
        providers: 1,
        keyErrors: 0,
        rateLimitErrors: 0,
        serverErrors: 1
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Video-to-Text Transcription API',
    supportedFormats: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'm4v', 'mp3', 'wav', 'm4a'],
    model: 'WhisperLargeV3',
    maxFileSize: '100MB',
    features: {
      timestamps: 'Optional timestamp inclusion',
      fileUpload: 'Direct file upload support (multipart/form-data)',
      asyncProcessing: 'Automatic polling for large files'
    },
    usage: {
      POST: 'Send video/audio file as multipart/form-data with "video" field name'
    },
    note: 'Video URL input is not currently supported. Please upload files directly.'
  });
}