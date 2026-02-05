import { NextRequest, NextResponse } from 'next/server';

const MAIL_TM_API = "https://api.mail.tm";

// GET /api/temp-email - Get domains or inbox
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'domains';
  const provider = searchParams.get('provider');
  const email = searchParams.get('email');
  const token = searchParams.get('token') || request.headers.get('x-mailtm-token');
  const messageId = searchParams.get('messageId');

  try {
    switch (action) {
      case 'domains':
        if (provider === 'mail.tm') {
          try {
            const res = await fetch(`${MAIL_TM_API}/domains`);
            if (!res.ok) {
              return NextResponse.json({ success: false, error: 'Failed to fetch Mail.tm domains' }, { status: 502 });
            }
            const data = await res.json();
            const domains = data['hydra:member']?.map((d: any) => d.domain).filter(Boolean) || [];
            return NextResponse.json({ success: true, domains: domains.length ? domains : ['mail.tm'] });
          } catch (error) {
            console.error('Mail.tm domains error:', error);
            return NextResponse.json({ success: false, error: 'Failed to fetch Mail.tm domains' }, { status: 502 });
          }
        }
        break;

      case 'inbox':
        if (provider === 'mail.tm' && token) {
          try {
            const res = await fetch(`${MAIL_TM_API}/messages`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
              return NextResponse.json({ success: false, error: 'Failed to fetch Mail.tm inbox' });
            }
            const data = await res.json();
            const messages = data['hydra:member'] || [];
            return NextResponse.json({ success: true, messages });
          } catch (error) {
            console.error('Mail.tm inbox error:', error);
            return NextResponse.json({ success: false, error: 'Failed to fetch Mail.tm inbox' });
          }
        } else {
          console.error('Missing required parameters for inbox:', { provider, token: !!token });
          return NextResponse.json({ success: false, error: 'Missing required parameters' });
        }
        break;

      case 'message':
        if (provider === 'mail.tm' && token && messageId) {
          try {
            const res = await fetch(`${MAIL_TM_API}/messages/${messageId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
              return NextResponse.json({ success: false, error: 'Failed to fetch Mail.tm message' });
            }
            const data = await res.json();
            return NextResponse.json({ success: true, message: data });
          } catch (error) {
            console.error('Mail.tm message error:', error);
            return NextResponse.json({ success: false, error: 'Failed to fetch Mail.tm message' });
          }
        } else {
          console.error('Missing required parameters for message:', { provider, messageId, token: !!token });
          return NextResponse.json({ success: false, error: 'Missing required parameters' });
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/temp-email - Create account or token
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const provider = searchParams.get('provider');
  const preferredDomain = searchParams.get('domain');

  try {
    if (action === 'create-account' && provider === 'mail.tm') {
      // Get available domains first
      let domain = (preferredDomain || '').trim() || 'mail.tm';
      try {
        const domainRes = await fetch(`${MAIL_TM_API}/domains`);
        if (domainRes.ok) {
          const domainData = await domainRes.json();
          const apiDomain = domainData['hydra:member']?.[0]?.domain;
          if (!preferredDomain && apiDomain) domain = apiDomain;
        }
      } catch {
        // ignore and keep default
      }
      
      // Generate random username and password
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let username = '';
      for (let i = 0; i < 10; i++) {
        username += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const email = `${username}@${domain}`;
      const password = Math.random().toString(36).substring(2, 18);

      // Create account
      const createRes = await fetch(`${MAIL_TM_API}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: email, password }),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        let errMsg = 'Failed to create Mail.tm account';
        try {
          const errData = JSON.parse(errText || '{}');
          errMsg = errData['hydra:description'] || errData.message || errData.error || errMsg;
        } catch {
          if (errText) errMsg = errText;
        }
        return NextResponse.json({ success: false, error: errMsg }, { status: 502 });
      }

      const accountText = await createRes.text();
      const accountData = accountText ? JSON.parse(accountText) : {};

      // Get token
      const tokenRes = await fetch(`${MAIL_TM_API}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: email, password }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        let errMsg = 'Failed to get Mail.tm token';
        try {
          const errData = JSON.parse(errText || '{}');
          errMsg = errData['hydra:description'] || errData.message || errData.error || errMsg;
        } catch {
          if (errText) errMsg = errText;
        }
        return NextResponse.json({ success: false, error: errMsg }, { status: 502 });
      }

      const tokenText = await tokenRes.text();
      const tokenData = tokenText ? JSON.parse(tokenText) : {};

      return NextResponse.json({
        success: true,
        account: {
          email,
          token: tokenData.token,
          id: accountData.id,
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action or provider' }, { status: 400 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/temp-email - Delete message
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  const messageId = searchParams.get('messageId');
  const token = searchParams.get('token') || request.headers.get('x-mailtm-token');

  try {
    if (provider === 'mail.tm' && token && messageId) {
      const res = await fetch(`${MAIL_TM_API}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return NextResponse.json({ success: res.ok });
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
