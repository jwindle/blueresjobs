import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { fetchJobPost } from '@/lib/atproto';
import JobPostForm from '@/components/JobPostForm';

type Props = { params: Promise<{ rkey: string }> };

export default async function EditJobPostPage({ params }: Props) {
  const { rkey } = await params;
  const session = await getSession();
  if (!session.did) redirect('/');

  const result = await fetchJobPost(session.did, rkey);
  if (!result) notFound();

  const actor = session.handle ?? session.did;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/view/${encodeURIComponent(actor)}/jobs`}
            className="text-sm hover:underline"
            style={{ color: 'var(--fg-muted)' }}
          >
            ← Back to jobs
          </Link>
          <h1 className="text-2xl font-bold mt-1" style={{ color: 'var(--fg)' }}>Edit Job Post</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)' }}>
            Stored on your Bluesky PDS
          </p>
        </div>
        <Link
          href={`/view/${encodeURIComponent(actor)}/jobs/${rkey}`}
          className="shrink-0 text-sm px-3 py-1.5 rounded border"
          style={{ borderColor: 'var(--border)', color: 'var(--fg-muted)' }}
        >
          View
        </Link>
      </div>
      <JobPostForm did={session.did} actor={actor} rkey={rkey} initial={result.record} />
    </div>
  );
}
