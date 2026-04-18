import { redirect, notFound } from 'next/navigation';
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>Edit Job Post</h1>
      <JobPostForm did={session.did} actor={session.handle ?? session.did} rkey={rkey} initial={result.record} />
    </div>
  );
}
