import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(new URL('/', APP_URL));
}
