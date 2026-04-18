import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { fetchJobPost, resolveActor } from '@/lib/atproto';

type Props = { params: Promise<{ actor: string; rkey: string }> };

export default async function ViewJobPostPage({ params }: Props) {
  const { actor: rawActor, rkey } = await params;
  const actor = decodeURIComponent(rawActor);

  const [{ did, handle }, session] = await Promise.all([
    resolveActor(actor),
    getSession(),
  ]);

  if (!did) notFound();

  // Canonicalize DID URLs to handle URLs
  if (handle && actor !== handle) {
    redirect(`/view/${encodeURIComponent(handle)}/jobs/${rkey}`);
  }

  const result = await fetchJobPost(did, rkey);
  if (!result) notFound();

  const { record } = result;
  const isOwner = session.did === did;
  const displayActor = handle ?? actor;

  return (
    <article className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>{record.postName}</h1>
        {isOwner && (
          <Link
            href={`/edit/jobs/${rkey}`}
            className="shrink-0 px-3 py-1.5 rounded text-sm font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            Edit
          </Link>
        )}
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Item label="Job title" value={record.jobTitle} />
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--fg-muted)' }}>Poster</dt>
          <dd><Link href={`/view/${encodeURIComponent(displayActor)}/employer`} style={{ color: 'var(--accent)' }}>{displayActor}</Link></dd>
        </div>
        <Item label="Location" value={record.jobLocation} />
        <Item label="Employment type" value={record.employmentType} />
        <Item label="Date posted" value={record.datePosted} />
        <Item label="Valid through" value={record.validThrough} />
        {record.estimatedSalary && (
          <Item
            label="Estimated salary"
            value={[record.estimatedSalary.min, record.estimatedSalary.max]
              .filter(Boolean).join(' – ')
              + (record.estimatedSalary.currency ? ` ${record.estimatedSalary.currency}` : '')
              + (record.estimatedSalary.comment ? ` (${record.estimatedSalary.comment})` : '')}
          />
        )}
        {record.url && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--fg-muted)' }}>Apply</dt>
            <dd>
              <a href={record.url} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--accent)' }} className="break-all">
                {record.url}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {record.shortDescription && (
        <Section title="Summary">
          <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--fg-muted)' }}>{record.shortDescription}</p>
        </Section>
      )}

      {record.longDescription && (
        <Section title="Description">
          <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--fg-muted)' }}>{record.longDescription}</p>
        </Section>
      )}

      {record.jobBenefits && (
        <Section title="Benefits">
          <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--fg-muted)' }}>{record.jobBenefits}</p>
        </Section>
      )}

      {record.jobTraits && record.jobTraits.length > 0 && (
        <Section title="About the job">
          <TraitValuesList traits={record.jobTraits} />
        </Section>
      )}

      {record.employeeTraits && record.employeeTraits.length > 0 && (
        <Section title="About the employee">
          <TraitValuesList traits={record.employeeTraits} />
        </Section>
      )}

      <div className="pt-2">
        <Link href={`/view/${encodeURIComponent(displayActor)}/jobs`} style={{ color: 'var(--accent)' }} className="text-sm">
          ← Back to job posts
        </Link>
      </div>
    </article>
  );
}

function Item({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--fg-muted)' }}>{label}</dt>
      <dd style={{ color: 'var(--fg)' }}>{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-semibold" style={{ color: 'var(--fg)' }}>{title}</h2>
      {children}
    </section>
  );
}

function TraitValuesList({ traits }: { traits: { key: string; values: string[] }[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {traits.map(t => (
        <li key={t.key}>
          <span className="font-medium" style={{ color: 'var(--fg)' }}>{t.key}</span>
          <ul className="mt-0.5 ml-4 flex flex-col gap-0.5" style={{ color: 'var(--fg-muted)' }}>
            {t.values.map((v, i) => <li key={i}>- {v}</li>)}
          </ul>
        </li>
      ))}
    </ul>
  );
}
