'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ActorSearch({ placeholder }: { placeholder: string }) {
  const [handle, setHandle] = useState('');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const actor = handle.trim().replace(/^@/, '');
    if (actor) router.push(`/view/${encodeURIComponent(actor)}/jobs`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium" style={{ color: 'var(--fg-muted)' }}>Bluesky handle or DID</span>
        <input
          type="text"
          value={handle}
          onChange={e => setHandle(e.target.value)}
          placeholder={placeholder}
          className="px-3 py-2 rounded border text-sm"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--fg)' }}
        />
      </label>
      <button
        type="submit"
        className="px-4 py-2 rounded text-sm font-medium"
        style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
      >
        View Jobs
      </button>
    </form>
  );
}
