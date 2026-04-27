import { NextResponse } from 'next/server';
import { fetchJobPost, resolveActor } from '@/lib/atproto';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ actor: string; rkey: string }> },
) {
  const { actor: rawActor, rkey } = await params;
  const actor = decodeURIComponent(rawActor);

  try {
    const { did } = await resolveActor(actor);
    if (!did) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const result = await fetchJobPost(did, rkey);
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(result.record);
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
