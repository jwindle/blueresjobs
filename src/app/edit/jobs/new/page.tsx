import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import JobPostForm from '@/components/JobPostForm';

export default async function NewJobPostPage() {
  const session = await getSession();
  if (!session.did) redirect('/');

  const actor = session.handle ?? session.did;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/view/${encodeURIComponent(actor)}/jobs`}
          className="text-sm hover:underline"
          style={{ color: 'var(--fg-muted)' }}
        >
          ← Back to jobs
        </Link>
        <h1 className="text-2xl font-bold mt-1" style={{ color: 'var(--fg)' }}>New Job Post</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)' }}>
          Stored on your Bluesky PDS
        </p>
      </div>
      <JobPostForm did={session.did} actor={actor} />
    </div>
  );
}
