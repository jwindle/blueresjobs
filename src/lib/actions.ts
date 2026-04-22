'use server';

import { getSession } from './auth';
import { getAgent, fetchJobPostsPage, createJobPost, putJobPost, deleteJobPost, putEmployer } from './atproto';
import type { EmployerRecord, JobPostRecord, JobPostEntry } from './types';
import { AtpAgent } from '@atproto/api';

// ---------------------------------------------------------------------------
// Identity resolution
// ---------------------------------------------------------------------------

// Accepts a DID (did:plc:... / did:web:...) or a handle (with or without
// leading @). Returns the resolved DID, or an error string.
export async function resolveIdentifier(
  input: string,
): Promise<{ did: string } | { error: string }> {
  const trimmed = input.trim().replace(/^@/, '');
  if (!trimmed) return { error: 'Empty input' };

  // Already a DID — return as-is
  if (trimmed.startsWith('did:')) return { did: trimmed };

  // Resolve handle → DID
  try {
    const agent = new AtpAgent({ service: 'https://bsky.social' });
    const { data } = await agent.com.atproto.identity.resolveHandle({ handle: trimmed });
    return { did: data.did };
  } catch {
    return { error: `Could not resolve "${trimmed}"` };
  }
}

// ---------------------------------------------------------------------------
// Employer
// ---------------------------------------------------------------------------

export async function saveEmployer(
  record: EmployerRecord,
): Promise<{ cid: string } | { error: string }> {
  const session = await getSession();
  if (!session.did) return { error: 'Unauthorized' };

  const agent = await getAgent();
  if (!agent) return { error: 'No active session' };

  try {
    const cid = await putEmployer(agent, session.did, record);
    return { cid };
  } catch (e) {
    return { error: String(e) };
  }
}

// ---------------------------------------------------------------------------
// Job posts
// ---------------------------------------------------------------------------

export async function getJobPostsPage(
  did: string,
  cursor?: string,
): Promise<{ posts: JobPostEntry[]; cursor?: string }> {
  return fetchJobPostsPage(did, cursor);
}

export async function saveJobPost(
  record: JobPostRecord,
  rkey?: string, // present when editing
): Promise<{ rkey: string; cid: string } | { error: string }> {
  const session = await getSession();
  if (!session.did) return { error: 'Unauthorized' };

  const agent = await getAgent();
  if (!agent) return { error: 'No active session' };

  try {
    if (rkey) {
      const cid = await putJobPost(agent, session.did, rkey, record);
      return { rkey, cid };
    } else {
      return await createJobPost(agent, session.did, record);
    }
  } catch (e) {
    console.error('[saveJobPost] failed:', e);
    return { error: String(e) };
  }
}

export async function removeJobPost(
  rkey: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session.did) return { error: 'Unauthorized' };

  const agent = await getAgent();
  if (!agent) return { error: 'No active session' };

  try {
    await deleteJobPost(agent, session.did, rkey);
    return {};
  } catch (e) {
    console.error('[removeJobPost] failed:', e);
    return { error: String(e) };
  }
}
