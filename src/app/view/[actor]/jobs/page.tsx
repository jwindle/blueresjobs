import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { resolveActor } from '@/lib/atproto';
import JobFeed from '@/components/JobFeed';

type Props = { params: Promise<{ actor: string }> };

export default async function JobFeedPage({ params }: Props) {
  const { actor: rawActor } = await params;
  const actor = decodeURIComponent(rawActor);

  const [{ did, handle }, session] = await Promise.all([
    resolveActor(actor),
    getSession(),
  ]);

  if (!did) notFound();

  // Canonicalize DID URLs to handle URLs
  if (handle && actor !== handle) {
    redirect(`/view/${encodeURIComponent(handle)}/jobs`);
  }

  const isOwner = session.did === did;
  const displayActor = handle ?? actor;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>Job Posts</h1>
        <p className="text-sm mt-0.5 flex items-center gap-2" style={{ color: 'var(--fg-muted)' }}>
          <span>{displayActor}</span>
          <Link href={`/view/${encodeURIComponent(displayActor)}/employer`} style={{ color: 'var(--accent)' }}>
            (about employer)
          </Link>
        </p>
      </div>
      <JobFeed did={did} actor={displayActor} isOwner={isOwner} />
    </div>
  );
}
