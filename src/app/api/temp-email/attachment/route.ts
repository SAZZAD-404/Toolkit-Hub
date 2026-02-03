import { NextRequest, NextResponse } from 'next/server';

const BARID_API = "https://api.barid.site";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const attachmentId = searchParams.get('id');
  const filename = searchParams.get('filename');

  if (!attachmentId) {
    return NextResponse.json({ success: false, error: 'Attachment ID required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${BARID_API}/attachments/${attachmentId}`);
    
    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch attachment' }, { status: 404 });
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const contentLength = res.headers.get('content-length');
    
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename || 'attachment'}"`,
    };

    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    // Stream the file content
    const arrayBuffer = await res.arrayBuffer();
    
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Attachment download error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download attachment' },
      { status: 500 }
    );
  }
}