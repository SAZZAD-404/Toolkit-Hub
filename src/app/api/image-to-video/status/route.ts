import { NextRequest, NextResponse } from 'next/server';
import { getRandomDeapiKey } from '@/lib/api-keys';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const apiKey = getRandomDeapiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'DEAPI key not configured' }, { status: 500 });
    }

    const response = await fetch(`https://api.deapi.ai/api/v1/client/request-status/${requestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
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
    const status = data.data?.status || data.status;
    
    // Extract video URL from various possible locations
    const videoUrl = data.data?.result_url || data.result_url || 
                    data.data?.video_url || data.video_url || 
                    data.data?.url || data.url ||
                    data.output?.video_url || data.result?.video_url || null;

    return NextResponse.json({
      success: true,
      status: status,
      videoUrl: videoUrl,
      progress: data.data?.progress || data.progress || null,
      error: data.data?.error || data.error || null,
      requestId: requestId
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to check status' 
    }, { status: 500 });
  }
}