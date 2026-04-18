import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { fetchEmployer, resolveActor } from '@/lib/atproto';
import type { Trait } from '@/lib/types';

type Props = { params: Promise<{ actor: string }> };

export default async function ViewEmployerPage({ params }: Props) {
  const { actor: rawActor } = await params;
  const actor = decodeURIComponent(rawActor);

  const [{ did, handle }, session] = await Promise.all([
    resolveActor(actor),
    getSession(),
  ]);

  if (!did) notFound();

  // Canonicalize DID URLs to handle URLs
  if (handle && actor !== handle) {
    redirect(`/view/${encodeURIComponent(handle)}/employer`);
  }

  const result = await fetchEmployer(did);
  if (!result) notFound();

  const { record } = result;
  const isOwner = session.did === did;
  const displayActor = handle ?? actor;

  return (
    <article className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {record.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={record.image}
              alt={record.name ?? 'Employer logo'}
              width={64}
              height={64}
              className="rounded object-contain"
            />
          )}
          {record.name && (
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>{record.name}</h1>
              <Link href={`/view/${encodeURIComponent(displayActor)}/jobs`} className="text-sm" style={{ color: 'var(--fg-muted)' }}>
                ({displayActor})
              </Link>
            </div>
          )}
        </div>
        {isOwner && (
          <Link
            href="/edit/employer"
            className="shrink-0 px-3 py-1.5 rounded text-sm font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            Edit
          </Link>
        )}
      </div>

      {record.shortDescription && (
        <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>{record.shortDescription}</p>
      )}

      {record.longDescription && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold" style={{ color: 'var(--fg)' }}>About</h2>
          <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--fg-muted)' }}>{record.longDescription}</p>
        </section>
      )}

      {record.jobTraits && record.jobTraits.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold" style={{ color: 'var(--fg)' }}>Our description of roles</h2>
          <TraitList traits={record.jobTraits} />
        </section>
      )}

      {record.employeeTraits && record.employeeTraits.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold" style={{ color: 'var(--fg)' }}>Our evaluation criteria</h2>
          <TraitList traits={record.employeeTraits} />
        </section>
      )}

    </article>
  );
}

function TraitList({ traits }: { traits: Trait[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {traits.map((trait, i) => (
        <li key={i} className="flex flex-col gap-0.5">
          <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
            {trait.name}
            {trait.importance != null && (
              <span className="ml-2 text-xs font-normal" style={{ color: 'var(--fg-muted)' }}>
                importance: {trait.importance}
              </span>
            )}
          </span>
          {trait.description && (
            <span className="text-sm" style={{ color: 'var(--fg-muted)' }}>{trait.description}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
