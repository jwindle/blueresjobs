'use client';

import { useState, useEffect } from 'react';
import { resolveIdentifier } from '@/lib/actions';

interface Props {
  label: string;
  value: string;           // always stored as a DID
  onChange: (did: string) => void;
  placeholder?: string;
}

export default function DidInput({ label, value, onChange, placeholder }: Props) {
  // Display what the user types; may be a handle or a DID
  const [display, setDisplay] = useState(value);
  const [resolvedDid, setResolvedDid] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  // Sync display if parent resets value (e.g. initial load)
  useEffect(() => {
    setDisplay(value);
    setResolvedDid(value || null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleBlur() {
    const trimmed = display.trim().replace(/^@/, '');
    if (!trimmed) {
      setResolvedDid(null);
      setError(null);
      onChange('');
      return;
    }

    // Already a DID — no need to resolve
    if (trimmed.startsWith('did:')) {
      setResolvedDid(trimmed);
      setError(null);
      onChange(trimmed);
      return;
    }

    // Resolve handle
    setResolving(true);
    setError(null);
    const result = await resolveIdentifier(trimmed);
    setResolving(false);

    if ('error' in result) {
      setError(result.error);
      setResolvedDid(null);
    } else {
      setResolvedDid(result.did);
      setError(null);
      onChange(result.did);
    }
  }

  const isDid = resolvedDid?.startsWith('did:');
  const showResolved = isDid && display.trim() !== resolvedDid;

  return (
    <label className="flex flex-col gap-1 text-sm" style={{ color: 'var(--fg-muted)' }}>
      {label}
      <input
        value={display}
        onChange={e => setDisplay(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder ?? 'did:plc:... or @handle'}
        className="w-full px-2 py-1.5 rounded border text-sm"
        style={{
          borderColor: error ? 'var(--danger)' : 'var(--border)',
          backgroundColor: 'var(--bg)',
          color: 'var(--fg)',
        }}
      />
      {resolving && (
        <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>Resolving…</span>
      )}
      {showResolved && !resolving && (
        <span className="text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>
          ✓ {resolvedDid}
        </span>
      )}
      {error && (
        <span className="text-xs" style={{ color: 'var(--danger)' }}>{error}</span>
      )}
    </label>
  );
}
