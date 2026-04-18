'use client';

import { useRef, useState } from 'react';
import type { EmployerRecord, Trait } from '@/lib/types';
import { saveEmployer } from '@/lib/actions';
import TraitEditor from './TraitEditor';

interface Props {
  initial?: Partial<EmployerRecord>;
}

export default function EmployerForm({ initial = {} }: Props) {
  const [name, setName] = useState(initial.name ?? '');
  const [shortDescription, setShortDescription] = useState(initial.shortDescription ?? '');
  const [longDescription, setLongDescription] = useState(initial.longDescription ?? '');
  const [image, setImage] = useState(initial.image ?? '');
  const [jobTraits, setJobTraits] = useState<Trait[]>(initial.jobTraits ?? []);
  const [employeeTraits, setEmployeeTraits] = useState<Trait[]>(initial.employeeTraits ?? []);

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as Partial<EmployerRecord>;
        setName(data.name ?? '');
        setShortDescription(data.shortDescription ?? '');
        setLongDescription(data.longDescription ?? '');
        setImage(data.image ?? '');
        setJobTraits(data.jobTraits ?? []);
        setEmployeeTraits(data.employeeTraits ?? []);
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
    setStatus('saving');

    const record: EmployerRecord = {
      name: name || undefined,
      shortDescription: shortDescription || undefined,
      longDescription: longDescription || undefined,
      image: image || undefined,
      jobTraits: jobTraits.length ? jobTraits : undefined,
      employeeTraits: employeeTraits.length ? employeeTraits : undefined,
    };

    const result = await saveEmployer(record);
    if ('error' in result) {
      setError(result.error);
      setStatus('error');
      return;
    }
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2000);
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

      <Field label="Organization name">
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Acme Corp" className={inputCls} style={inputStyle} />
      </Field>
      <Field label="Short description">
        <textarea rows={2} value={shortDescription} onChange={e => setShortDescription(e.target.value)}
          placeholder="One or two sentences about your company…" className={inputCls} style={inputStyle} />
      </Field>
      <Field label="Long description">
        <textarea rows={6} value={longDescription} onChange={e => setLongDescription(e.target.value)}
          placeholder="Extended overview of your company…" className={inputCls} style={inputStyle} />
      </Field>
      <Field label="Logo / image URL">
        <input type="url" value={image} onChange={e => setImage(e.target.value)}
          placeholder="https://..." className={inputCls} style={inputStyle} />
      </Field>

      <TraitEditor
        label="Job traits"
        value={jobTraits}
        onChange={setJobTraits}
      />
      <TraitEditor
        label="Employee traits"
        value={employeeTraits}
        onChange={setEmployeeTraits}
      />

      <div className="flex items-center gap-4">
        <button type="submit" disabled={status === 'saving'}
          className="px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}>
          {status === 'saving' ? 'Saving…' : 'Save to PDS'}
        </button>
        {status === 'saved' && (
          <span className="text-sm" style={{ color: 'var(--fg-muted)' }}>Saved ✓</span>
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
