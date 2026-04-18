import { oauthClient } from '@/lib/oauth';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(oauthClient.clientMetadata);
}
