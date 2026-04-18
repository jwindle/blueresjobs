import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function ViewJobsIndexPage() {
  const session = await getSession();
  if (session.did) {
    redirect(`/view/${encodeURIComponent(session.handle ?? session.did)}/jobs`);
  }
  redirect('/');
}
