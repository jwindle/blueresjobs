import Link from 'next/link';
import { getSession } from '@/lib/auth';

export default async function NavBar() {
  const session = await getSession();
  const isLoggedIn = !!session.did;

  return (
    <nav className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg" style={{ color: 'var(--fg)' }}>
          BlueRes Jobs
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {isLoggedIn && (
            <>
              <Link href={`/view/${encodeURIComponent(session.handle ?? session.did!)}/jobs`} style={{ color: 'var(--fg-muted)' }}>
                {session.handle} job list
              </Link>
              <form action="/api/oauth/logout" method="POST">
                <button type="submit" style={{ color: 'var(--fg-muted)' }}>
                  Log out
                </button>
              </form>
            </>
          )}
          {!isLoggedIn && (
            <Link
              href="/login"
              className="px-3 py-1 rounded text-sm"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
