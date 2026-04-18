'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getJobPostsPage } from '@/lib/actions';
import type { JobPostEntry } from '@/lib/types';

interface Props {
  did: string;
  actor: string;
  isOwner: boolean;
}

export default function JobFeed({ did, actor, isOwner }: Props) {
  const [posts, setPosts] = useState<JobPostEntry[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (nextCursor?: string) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getJobPostsPage(did, nextCursor);
      setPosts(prev => nextCursor ? [...prev, ...data.posts] : data.posts);
      setCursor(data.cursor);
      setHasMore(!!data.cursor && data.posts.length > 0);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [did]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPosts([]);
    setCursor(undefined);
    setHasMore(true);
    fetchPage();
  }, [did]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) fetchPage(cursor);
    }, { rootMargin: '200px' });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, cursor, fetchPage]);

  return (
    <div className="flex flex-col gap-4">
      {isOwner && (
        <div className="flex gap-3">
          <Link
            href="/edit/jobs/new"
            className="px-3 py-1.5 rounded text-sm font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            + Add Job
          </Link>
          <Link
            href="/edit/employer"
            className="px-3 py-1.5 rounded border text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
          >
            Edit Employer
          </Link>
        </div>
      )}

      {error && (
        <p className="text-sm px-3 py-2 rounded"
          style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      {!loading && posts.length === 0 && (
        <p style={{ color: 'var(--fg-muted)' }}>No job posts found.</p>
      )}

      <ul className="flex flex-col gap-3">
        {posts.map(entry => (
          <li key={entry.rkey}>
            <JobCard entry={entry} actor={actor} isOwner={isOwner} />
          </li>
        ))}
      </ul>

      <div ref={sentinelRef} className="h-1" />

      {loading && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--fg-muted)' }}>Loading…</p>
      )}
    </div>
  );
}

function JobCard({ entry, actor, isOwner }: { entry: JobPostEntry; actor: string; isOwner: boolean }) {
  const { rkey, record } = entry;
  return (
    <div className="rounded-lg border p-4"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/view/${encodeURIComponent(actor)}/jobs/${rkey}`}
          className="font-semibold hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          {record.postName}
        </Link>
        {isOwner && (
          <Link
            href={`/edit/jobs/${rkey}`}
            className="shrink-0 text-xs px-2 py-0.5 rounded border"
            style={{ borderColor: 'var(--border)', color: 'var(--fg-muted)' }}
          >
            Edit
          </Link>
        )}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm" style={{ color: 'var(--fg-muted)' }}>
        {record.jobTitle && <span>{record.jobTitle}</span>}
        {record.jobLocation && <span>{record.jobLocation}</span>}
        {record.employmentType && <span>{record.employmentType}</span>}
        {record.datePosted && <span>Posted {record.datePosted}</span>}
      </div>
      {record.shortDescription && (
        <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--fg-muted)' }}>
          {record.shortDescription}
        </p>
      )}
    </div>
  );
}
