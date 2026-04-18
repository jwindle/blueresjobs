import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import JobPostForm from '@/components/JobPostForm';

export default async function NewJobPostPage() {
  const session = await getSession();
  if (!session.did) redirect('/');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>New Job Post</h1>
      <JobPostForm did={session.did} actor={session.handle ?? session.did} />
    </div>
  );
}
