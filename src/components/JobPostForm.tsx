'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { JobPostRecord, TraitValues, Salary } from '@/lib/types';
import { saveJobPost, removeJobPost } from '@/lib/actions';
import TraitValuesEditor from './TraitValuesEditor';
import DidInput from './DidInput';

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'temporary'];

interface Props {
  did: string;
  actor: string;
  rkey?: string; // present when editing
  initial?: Partial<JobPostRecord>;
}

export default function JobPostForm({ did, actor, rkey, initial = {} }: Props) {
  const router = useRouter();
  const isEdit = !!rkey;

  const [postName, setPostName] = useState(initial.postName ?? '');
  const [jobTitle, setJobTitle] = useState(initial.jobTitle ?? '');
  const [jobLocation, setJobLocation] = useState(initial.jobLocation ?? '');
  const [employmentType, setEmploymentType] = useState(initial.employmentType ?? '');
  const [datePosted, setDatePosted] = useState(initial.datePosted ?? new Date().toISOString().slice(0, 10));
  const [validThrough, setValidThrough] = useState(initial.validThrough ?? '');
  const [url, setUrl] = useState(initial.url ?? '');
  const [applicationContact, setApplicationContact] = useState(initial.applicationContact ?? '');
  const [employerRef, setEmployerRef] = useState(initial.employerRef ?? '');
  const [shortDescription, setShortDescription] = useState(initial.shortDescription ?? '');
  const [longDescription, setLongDescription] = useState(initial.longDescription ?? '');
  const [jobBenefits, setJobBenefits] = useState(initial.jobBenefits ?? '');

  const s = initial.estimatedSalary as Salary | undefined;
  const [salaryMin, setSalaryMin] = useState(s?.min?.toString() ?? '');
  const [salaryMax, setSalaryMax] = useState(s?.max?.toString() ?? '');
  const [salaryCurrency, setSalaryCurrency] = useState(s?.currency ?? 'USD');
  const [salaryComment, setSalaryComment] = useState(s?.comment ?? '');

  const [jobTraits, setJobTraits] = useState<TraitValues[]>(initial.jobTraits ?? []);
  const [employeeTraits, setEmployeeTraits] = useState<TraitValues[]>(initial.employeeTraits ?? []);
  const [active, setActive] = useState(initial.active ?? false);

  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!rkey) return;
    if (!window.confirm('Delete this job post? This cannot be undone.')) return;
    setDeleting(true);
    const result = await removeJobPost(rkey);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/view/${encodeURIComponent(actor)}/jobs`);
  }
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as Partial<JobPostRecord>;
        setPostName(data.postName ?? '');
        setJobTitle(data.jobTitle ?? '');
        setJobLocation(data.jobLocation ?? '');
        setEmploymentType(data.employmentType ?? '');
        setDatePosted(data.datePosted ?? new Date().toISOString().slice(0, 10));
        setValidThrough(data.validThrough ?? '');
        setUrl(data.url ?? '');
        setApplicationContact(data.applicationContact ?? '');
        setEmployerRef(data.employerRef ?? '');
        setShortDescription(data.shortDescription ?? '');
        setLongDescription(data.longDescription ?? '');
        setJobBenefits(data.jobBenefits ?? '');
        const sal = data.estimatedSalary;
        setSalaryMin(sal?.min?.toString() ?? '');
        setSalaryMax(sal?.max?.toString() ?? '');
        setSalaryCurrency(sal?.currency ?? 'USD');
        setSalaryComment(sal?.comment ?? '');
        setJobTraits(data.jobTraits ?? []);
        setEmployeeTraits(data.employeeTraits ?? []);
        setActive(data.active ?? false);
        setImportError(null);
      } catch {
        setImportError('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const hasSalary = salaryMin || salaryMax;
    const record: JobPostRecord = {
      postName,
      jobTitle: jobTitle || undefined,
      jobLocation: jobLocation || undefined,
      employmentType: employmentType || undefined,
      datePosted,
      validThrough: validThrough || undefined,
      url: url || undefined,
      applicationContact: applicationContact || undefined,
      employerRef: employerRef || undefined,
      shortDescription: shortDescription || undefined,
      longDescription: longDescription || undefined,
      jobBenefits: jobBenefits || undefined,
      estimatedSalary: hasSalary ? {
        min: salaryMin ? parseInt(salaryMin, 10) : undefined,
        max: salaryMax ? parseInt(salaryMax, 10) : undefined,
        currency: salaryCurrency || undefined,
        comment: salaryComment || undefined,
      } : undefined,
      jobTraits: jobTraits?.length ? jobTraits : undefined,
      employeeTraits: employeeTraits?.length ? employeeTraits : undefined,
      active: active || undefined,
    };

    const result = await saveJobPost(record, rkey);
    setSaving(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    router.push(`/view/${encodeURIComponent(actor)}/jobs/${result.rkey}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded border text-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}>
          Import JSON
        </button>
        {importError && (
          <span className="text-sm" style={{ color: 'var(--danger)' }}>{importError}</span>
        )}
      </div>

      {error && (
        <p className="text-sm px-3 py-2 rounded" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      <Field label="Post name (this should uniquely identify the position) *">
        <input required value={postName} onChange={e => setPostName(e.target.value)}
          placeholder="Senior Rust Engineer – Remote 2025" className={inputCls} style={inputStyle} />
      </Field>

      <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--fg)' }}>
        <input
          type="checkbox"
          checked={active}
          onChange={e => setActive(e.target.checked)}
          className="w-4 h-4"
        />
        Active — confirmed open for hiring
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Job title">
          <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
            placeholder="Software Engineer" className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Employment type">
          <select value={employmentType} onChange={e => setEmploymentType(e.target.value)}
            className={inputCls} style={inputStyle}>
            <option value="">— select —</option>
            {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Location">
          <input value={jobLocation} onChange={e => setJobLocation(e.target.value)}
            placeholder="Remote" className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Application URL">
          <input type="url" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://..." className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Date posted *">
          <input required type="date" value={datePosted} onChange={e => setDatePosted(e.target.value)}
            className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Valid through">
          <input type="date" value={validThrough} onChange={e => setValidThrough(e.target.value)}
            className={inputCls} style={inputStyle} />
        </Field>
        <DidInput
          label="Application contact"
          value={applicationContact}
          onChange={setApplicationContact}
        />
        <DidInput
          label="Employer ref (if not yourself)"
          value={employerRef}
          onChange={setEmployerRef}
        />
      </div>

      <fieldset className="rounded border p-4" style={{ borderColor: 'var(--border)' }}>
        <legend className="text-sm font-medium px-1" style={{ color: 'var(--fg-muted)' }}>
          Estimated salary
        </legend>
        <div className="flex flex-col gap-3 mt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Min">
              <input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Max">
              <input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Currency">
              <input value={salaryCurrency} onChange={e => setSalaryCurrency(e.target.value)}
                placeholder="USD" className={inputCls} style={inputStyle} />
            </Field>
          </div>
          <Field label="Comment">
            <textarea rows={3} value={salaryComment} onChange={e => setSalaryComment(e.target.value)}
              placeholder="e.g. $120k–$160k per year depending on experience"
              className={inputCls} style={inputStyle} />
          </Field>
        </div>
      </fieldset>

      <Field label="Short description">
        <textarea rows={3} value={shortDescription} onChange={e => setShortDescription(e.target.value)}
          placeholder="One paragraph overview of the role…" className={inputCls} style={inputStyle} />
      </Field>
      <Field label="Long description">
        <textarea rows={8} value={longDescription} onChange={e => setLongDescription(e.target.value)}
          placeholder="Full job description…" className={inputCls} style={inputStyle} />
      </Field>
      <Field label="Benefits">
        <textarea rows={4} value={jobBenefits} onChange={e => setJobBenefits(e.target.value)}
          placeholder="- Health insurance&#10;- 401k…" className={inputCls} style={inputStyle} />
      </Field>

      <TraitValuesEditor
        label="About the job (aka Job Traits), start each item with '- ' on its own line."
        value={jobTraits}
        onChange={setJobTraits}
      />
      <TraitValuesEditor
        label="About the employee (aka Employee Traits), start each item with '- ' on its own line."
        value={employeeTraits}
        onChange={setEmployeeTraits}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create post'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2 rounded text-sm"
            style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--fg)' }}>
            Cancel
          </button>
        </div>
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="px-4 py-2 rounded text-sm disabled:opacity-50"
            style={{ color: 'var(--danger)' }}>
            {deleting ? 'Deleting…' : 'Delete post'}
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm" style={{ color: 'var(--fg-muted)' }}>
      {label}
      {children}
    </label>
  );
}

const inputCls = 'w-full px-2 py-1.5 rounded border text-sm';
const inputStyle = {
  borderColor: 'var(--border)',
  backgroundColor: 'var(--bg)',
  color: 'var(--fg)',
};
