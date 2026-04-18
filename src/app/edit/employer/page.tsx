import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { fetchEmployer } from '@/lib/atproto';
import EmployerForm from '@/components/EmployerForm';

export default async function EditEmployerPage() {
  const session = await getSession();
  if (!session.did) redirect('/');

  const result = await fetchEmployer(session.did);
  const record = result?.record ?? {};

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>Employer Profile</h1>
          <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
            Stored as a singleton record in your Bluesky PDS. Optional, but enriches your job posts.
          </p>
        </div>
        <Link
          href="/edit/jobs/new"
          className="shrink-0 px-3 py-1.5 rounded text-sm font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          + Add Job
        </Link>
      </div>
      <EmployerForm initial={record} />
    </div>
  );
}
