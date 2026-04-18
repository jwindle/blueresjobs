import { oauthClient } from '@/lib/oauth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle');
  if (!handle) {
    return NextResponse.json({ error: 'handle required' }, { status: 400 });
  }
  try {
    const url = await oauthClient.authorize(handle, { scope: 'atproto transition:generic' });
    return NextResponse.redirect(url);
  } catch (err) {
    console.error('OAuth login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
