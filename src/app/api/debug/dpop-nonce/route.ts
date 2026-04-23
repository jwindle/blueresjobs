import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Only available in dev — returns 404 in production
export async function DELETE() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const prefix = process.env.REDIS_PREFIX ?? 'blueresjobs';
  const pattern = `${prefix}:dpop-nonce:*`;

  const keys: string[] = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }

  return NextResponse.json({ deleted: keys });
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const prefix = process.env.REDIS_PREFIX ?? 'blueresjobs';
  const pattern = `${prefix}:dpop-nonce:*`;

  const keys: string[] = await redis.keys(pattern);
  const entries: Record<string, unknown> = {};
  for (const key of keys) {
    entries[key] = await redis.get(key);
  }

  return NextResponse.json({ entries });
}
