'use client';

import { useState } from 'react';
import type { Trait } from '@/lib/types';

interface Props {
  label: string;
  value: Trait[];
  onChange: (traits: Trait[]) => void;
}

const emptyDraft = (): Trait => ({ name: '', description: '', importance: undefined });

export default function TraitEditor({ label, value, onChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Trait>(emptyDraft());

  function openAdd() {
    setDraft(emptyDraft());
    setEditingIndex(-1);
  }

  function openEdit(i: number) {
    setDraft({ ...value[i] });
    setEditingIndex(i);
  }

  function cancelEdit() {
    setEditingIndex(null);
    setDraft(emptyDraft());
  }

  function commitEdit() {
    if (!draft.name.trim()) return;
    const next = [...value];
    const cleaned: Trait = {
      name: draft.name.trim(),
      description: draft.description?.trim() || undefined,
      importance: draft.importance != null && !Number.isNaN(draft.importance)
        ? draft.importance
        : undefined,
    };
    if (editingIndex === -1) {
      next.push(cleaned);
    } else if (editingIndex !== null) {
      next[editingIndex] = cleaned;
    }
    onChange(next);
    cancelEdit();
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium" style={{ color: 'var(--fg-muted)' }}>{label}</span>

      {value.length > 0 && (
        <ul className="flex flex-col gap-1">
          {value.map((trait, i) => (
            <li key={i} className="flex items-start justify-between gap-3 rounded border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium" style={{ color: 'var(--fg)' }}>
                  {trait.name}
                  {trait.importance != null && (
                    <span className="ml-2 text-xs" style={{ color: 'var(--fg-muted)' }}>
                      importance: {trait.importance}
                    </span>
                  )}
                </span>
                {trait.description && (
                  <span style={{ color: 'var(--fg-muted)' }}>{trait.description}</span>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => openEdit(i)}
                  className="text-xs" style={{ color: 'var(--accent)' }}>
                  Edit
                </button>
                <button type="button" onClick={() => remove(i)}
                  className="text-xs" style={{ color: 'var(--danger)' }}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingIndex !== null ? (
        <div className="rounded border p-3 flex flex-col gap-3"
          style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--bg-subtle)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InlineField label="Name *">
              <input
                autoFocus
                value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Remote Friendly"
                className={inputCls} style={inputStyle}
              />
            </InlineField>
            <InlineField label="Importance">
              <input
                type="number"
                value={draft.importance ?? ''}
                onChange={e => setDraft(d => ({
                  ...d,
                  importance: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                }))}
                placeholder="0"
                className={inputCls} style={inputStyle}
              />
            </InlineField>
            <InlineField label="Description" className="sm:col-span-2">
              <input
                value={draft.description ?? ''}
                onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                placeholder="What this trait means…"
                className={inputCls} style={inputStyle}
              />
            </InlineField>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={commitEdit}
              disabled={!draft.name.trim()}
              className="px-3 py-1 rounded text-xs font-medium disabled:opacity-40"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}>
              {editingIndex === -1 ? 'Add' : 'Update'}
            </button>
            <button type="button" onClick={cancelEdit}
              className="px-3 py-1 rounded text-xs"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)' }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={openAdd}
          className="self-start px-3 py-1 rounded border text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
          + Add trait
        </button>
      )}
    </div>
  );
}

function InlineField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 text-xs ${className ?? ''}`} style={{ color: 'var(--fg-muted)' }}>
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
