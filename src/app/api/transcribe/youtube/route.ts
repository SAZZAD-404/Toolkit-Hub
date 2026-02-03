import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

async function pollForResult(requestId: string, apiKey: string, maxAttempts = 60): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between polls
    
    const statusResponse = await fetch(`https://api.deapi.ai/api/v1/client/requests/${requestId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      continue;
    }

    const statusData = await statusResponse.json();
    const status = statusData.data?.status || statusData.status;
    
    if (status === 'completed' || status === 'success') {
      return statusData.data?.result?.text || statusData.data?.text || statusData.result?.text || '';
    }
    
    if (status === 'failed' || status === 'error') {
      throw new Error(statusData.data?.error || 'Transcription failed');
    }
  }
  
  throw new Error('Transcription timed out');
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
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
        console.log(`[YouTube Transcription] Trying DEAPI key ${totalAttempts}/${deapiKeys.length}`);

        const response = await fetch('https://api.deapi.ai/api/v1/client/vid2txt', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'WhisperLargeV3',
            include_ts: false,
            return_result_in_response: true, // Get immediate response
            video_url: url,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('deAPI vid2txt error:', errorData);
          
          // Check if it's a rate limit or auth error
          if (response.status === 429) {
            console.log(`[YouTube Transcription] Rate limit hit, trying next key`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          if (response.status === 401 || response.status === 403) {
            console.log(`[YouTube Transcription] Auth error, trying next key`);
            continue;
          }
          
          throw new Error(errorData.message || 'Failed to transcribe video');
        }

        const data = await response.json();
        
        // Check for immediate transcription response (return_result_in_response: true)
        if (data.text || data.transcription || data.result) {
          const text = data.text || data.transcription || data.result;
          return NextResponse.json({
            success: true,
            text: text,
            requestId: data.request_id || 'immediate',
            provider: 'DEAPI',
            attempts: totalAttempts
          });
        }
        
        // Handle async processing with request_id (fallback)
        const requestId = data.data?.request_id || data.request_id;
        if (requestId) {
          console.log(`[YouTube Transcription] Using async processing with request ID: ${requestId}`);
          // Poll for result
          const text = await pollForResult(requestId, apiKey);

          return NextResponse.json({
            success: true,
            text,
            requestId,
            provider: 'DEAPI',
            attempts: totalAttempts
          });
        }

        throw new Error('No transcription or request ID in response');

      } catch (error: any) {
        lastError = error;
        console.error(`[YouTube Transcription] DEAPI key ${totalAttempts} failed:`, error.message);
        
        // If it's the last key, don't continue
        if (totalAttempts === deapiKeys.length) {
          break;
        }
        
        // Wait before trying next key
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // All keys failed
    console.error(`[YouTube Transcription] All ${deapiKeys.length} DEAPI keys failed`);
    
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
    console.error('YouTube transcription error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to transcribe YouTube video',
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