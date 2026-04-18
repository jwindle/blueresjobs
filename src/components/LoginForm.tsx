'use client';

import { useState } from 'react';

export default function LoginForm() {
  const [handle, setHandle] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!handle.trim()) return;
    window.location.href = `/api/oauth/login?handle=${encodeURIComponent(handle.trim())}`;
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="your.bsky.handle"
          value={handle}
          onChange={e => setHandle(e.target.value)}
          className="w-full px-3 py-2 rounded border text-sm"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--fg)',
          }}
        />
        <button
          type="submit"
          className="w-full px-3 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          Log in with Bluesky
        </button>
      </form>
      <p className="text-sm text-center">
        <a href="/view/jobs/" style={{ color: 'var(--accent)' }}>
          Browse job posts without logging in →
        </a>
      </p>
    </>
  );
}
