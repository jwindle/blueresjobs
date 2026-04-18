import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';

export default async function LoginPage() {
  const session = await getSession();
  if (session.did) {
    redirect('/');
  }

  return (
    <div className="max-w-sm mx-auto mt-16 flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>
        Log in to BlueRes Jobs
      </h1>
      <p style={{ color: 'var(--fg-muted)' }}>
        Create and manage job postings stored on the AT Protocol.
      </p>
      <LoginForm />
    </div>
  );
}
