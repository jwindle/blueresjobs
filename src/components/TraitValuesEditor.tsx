'use client';

import { useEffect, useState } from 'react';
import type { TraitValues } from '@/lib/types';

interface Props {
  label: string;
  value: TraitValues[];
  onChange: (traits: TraitValues[]) => void;
}

// Parse a textarea of "- item" lines (or bare lines) into a string[]
function parseValues(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.replace(/^\s*-\s*/, '').trim())
    .filter(v => v.length > 0);
}

// Serialize a string[] back to "- item" lines
function serializeValues(values: string[]): string {
  return values.map(v => `- ${v}`).join('\n');
}

// Initialize raw text map from the value prop (keyed by trait key)
function initTexts(traits: TraitValues[]): Record<string, string> {
  return Object.fromEntries(traits.map(t => [t.key, serializeValues(t.values)]));
}

export default function TraitValuesEditor({ label, value, onChange }: Props) {
  // Raw textarea content lives here — NOT derived from value on every render.
  // This prevents the cursor-jumping / mid-type transformation problem.
  const [texts, setTexts] = useState<Record<string, string>>(() => initTexts(value));
  const [newKey, setNewKey] = useState('');
  const [addingKey, setAddingKey] = useState(false);

  useEffect(() => {
    setTexts(initTexts(value));
  }, [value]);

  function handleTextChange(key: string, text: string) {
    setTexts(prev => ({ ...prev, [key]: text }));
  }

  // Only parse and propagate to the parent when the user leaves the textarea
  function handleBlur(key: string) {
    const parsed = parseValues(texts[key] ?? '');
    const next = value.map(t => t.key === key ? { ...t, values: parsed } : t);
    onChange(next);
  }

  function removeKey(key: string) {
    setTexts(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    onChange(value.filter(t => t.key !== key));
  }

  function commitNewKey() {
    const key = newKey.trim();
    if (!key) return;
    setTexts(prev => ({ ...prev, [key]: '' }));
    onChange([...value, { key, values: [] }]);
    setNewKey('');
    setAddingKey(false);
  }

  function handleNewKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); commitNewKey(); }
    if (e.key === 'Escape') { setAddingKey(false); setNewKey(''); }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium" style={{ color: 'var(--fg-muted)' }}>{label}</span>

      {value.map(trait => (
        <div key={trait.key} className="rounded border p-3 flex flex-col gap-2"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium font-mono" style={{ color: 'var(--fg)' }}>
              {trait.key}
            </span>
            <button type="button" onClick={() => removeKey(trait.key)}
              className="text-xs" style={{ color: 'var(--danger)' }}>
              Remove
            </button>
          </div>
          <textarea
            rows={3}
            value={texts[trait.key] ?? ''}
            onChange={e => handleTextChange(trait.key, e.target.value)}
            onBlur={() => handleBlur(trait.key)}
            placeholder="- first item&#10;- second item"
            className="w-full px-2 py-1.5 rounded border text-sm"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--bg)',
              color: 'var(--fg)',
            }}
          />
        </div>
      ))}

      {addingKey ? (
        <div className="flex gap-2 items-center">
          <input
            autoFocus
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            onKeyDown={handleNewKeyDown}
            placeholder="trait key"
            className="px-2 py-1.5 rounded border text-sm font-mono"
            style={{
              borderColor: 'var(--accent)',
              backgroundColor: 'var(--bg)',
              color: 'var(--fg)',
            }}
          />
          <button type="button" onClick={commitNewKey}
            disabled={!newKey.trim()}
            className="px-3 py-1 rounded text-xs font-medium disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}>
            Add
          </button>
          <button type="button" onClick={() => { setAddingKey(false); setNewKey(''); }}
            className="text-xs" style={{ color: 'var(--fg-muted)' }}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setAddingKey(true)}
          className="self-start px-3 py-1 rounded border text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
          + Add key
        </button>
      )}
    </div>
  );
}
