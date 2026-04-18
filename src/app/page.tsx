import { getSession } from '@/lib/auth';
import ActorSearch from '@/components/ActorSearch';
import Link from 'next/link';

export default async function HomePage() {
  const session = await getSession();
  const placeholder = session.handle ?? session.did ?? 'windle.bsky.social';

  return (
    <div className="max-w-sm mx-auto mt-16 flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>
        Browse Jobs
      </h1>
      <ActorSearch placeholder={placeholder} />
      {!session.did && (
        <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
          <Link href="/login" style={{ color: 'var(--accent)' }}>
            Log in
          </Link>{' '}
          to edit your jobs.
        </p>
      )}
    </div>
  );
}
