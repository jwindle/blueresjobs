import { Agent, AtpAgent } from '@atproto/api';
import { getSession } from './auth';
import { oauthClient } from './oauth';
import { NSID, EMPLOYER_RKEY } from './lexicons';
import type { EmployerRecord, JobPostRecord, JobPostEntry } from './types';

export async function resolveHandle(did: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://bsky.social/xrpc/com.atproto.repo.describeRepo?repo=${encodeURIComponent(did)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.handle as string) ?? null;
  } catch {
    return null;
  }
}

export async function resolveHandleToDid(handle: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.did as string) ?? null;
  } catch {
    return null;
  }
}

// Accepts either a handle or DID, returns { did, handle }.
// handle may be null if resolution fails (non-fatal — display DID instead).
// did is null if a handle was given and couldn't be resolved (fatal — caller should 404).
export async function resolveActor(
  actor: string,
): Promise<{ did: string | null; handle: string | null }> {
  if (actor.startsWith('did:')) {
    const handle = await resolveHandle(actor);
    return { did: actor, handle };
  }
  const did = await resolveHandleToDid(actor);
  return { did, handle: actor };
}

export async function getAgent(): Promise<Agent | null> {
  const session = await getSession();
  if (!session.did) return null;
  try {
    const oauthSession = await oauthClient.restore(session.did);
    return new Agent(oauthSession);
  } catch {
    return null;
  }
}

async function getPdsFromDid(did: string): Promise<string> {
  try {
    let docUrl: string;
    if (did.startsWith('did:plc:')) {
      docUrl = `https://plc.directory/${did}`;
    } else if (did.startsWith('did:web:')) {
      const domain = did.slice('did:web:'.length);
      docUrl = `https://${domain}/.well-known/did.json`;
    } else {
      return 'https://bsky.social';
    }
    const res = await fetch(docUrl, { next: { revalidate: 300 } });
    if (!res.ok) return 'https://bsky.social';
    const doc = await res.json();
    const service = (doc.service as Array<{ id: string; type: string; serviceEndpoint: string }> | undefined)
      ?.find(s => s.id === '#atproto_pds' || s.type === 'AtprotoPersonalDataServer');
    return service?.serviceEndpoint ?? 'https://bsky.social';
  } catch {
    return 'https://bsky.social';
  }
}

// ---------------------------------------------------------------------------
// Employer
// ---------------------------------------------------------------------------

export async function fetchEmployer(
  did: string,
): Promise<{ record: EmployerRecord; cid: string } | null> {
  const pdsUrl = await getPdsFromDid(did);
  const agent = new AtpAgent({ service: pdsUrl });
  try {
    const { data } = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: NSID.EMPLOYER,
      rkey: EMPLOYER_RKEY,
    });
    return { record: data.value as EmployerRecord, cid: data.cid! };
  } catch {
    return null;
  }
}

export async function putEmployer(
  agent: Agent,
  did: string,
  record: EmployerRecord,
): Promise<string> {
  const { data } = await agent.com.atproto.repo.putRecord({
    repo: did,
    collection: NSID.EMPLOYER,
    rkey: EMPLOYER_RKEY,
    record,
  });
  return data.cid;
}

// ---------------------------------------------------------------------------
// Job posts
// ---------------------------------------------------------------------------

export async function fetchJobPost(
  did: string,
  rkey: string,
): Promise<{ record: JobPostRecord; cid: string } | null> {
  const pdsUrl = await getPdsFromDid(did);
  const agent = new AtpAgent({ service: pdsUrl });
  try {
    const { data } = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: NSID.JOB_POST,
      rkey,
    });
    return { record: data.value as JobPostRecord, cid: data.cid! };
  } catch {
    return null;
  }
}

// Cursor-based page fetch — used by the feed.
export async function fetchJobPostsPage(
  did: string,
  cursor?: string,
  limit = 20,
): Promise<{ posts: JobPostEntry[]; cursor?: string }> {
  const pdsUrl = await getPdsFromDid(did);
  const agent = new AtpAgent({ service: pdsUrl });
  try {
    const { data } = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: NSID.JOB_POST,
      limit,
      cursor,
    });
    const posts: JobPostEntry[] = data.records.map(r => ({
      did,
      rkey: r.uri.split('/').pop()!,
      cid: r.cid,
      record: r.value as JobPostRecord,
    }));
    return { posts, cursor: data.cursor };
  } catch {
    return { posts: [] };
  }
}

export async function createJobPost(
  agent: Agent,
  did: string,
  record: JobPostRecord,
): Promise<{ rkey: string; cid: string }> {
  const { data } = await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: NSID.JOB_POST,
    record,
  });
  return { rkey: data.uri.split('/').pop()!, cid: data.cid };
}

export async function putJobPost(
  agent: Agent,
  did: string,
  rkey: string,
  record: JobPostRecord,
): Promise<string> {
  const { data } = await agent.com.atproto.repo.putRecord({
    repo: did,
    collection: NSID.JOB_POST,
    rkey,
    record,
  });
  return data.cid;
}

export async function deleteJobPost(
  agent: Agent,
  did: string,
  rkey: string,
): Promise<void> {
  await agent.com.atproto.repo.applyWrites({
    repo: did,
    writes: [{ $type: 'com.atproto.repo.applyWrites#delete', collection: NSID.JOB_POST, rkey }],
  });
}
