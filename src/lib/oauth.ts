import { NodeOAuthClient, requestLocalLock } from '@atproto/oauth-client-node';
import { Redis } from '@upstash/redis';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const REDIS_PREFIX = process.env.REDIS_PREFIX ?? 'blueresjobs';

function redisStore(prefix: string) {
  return {
    async get(key: string) {
      const value = await redis.get(`${REDIS_PREFIX}:${prefix}:${key}`);
      // Redis returns null for missing keys; the SimpleStore interface expects undefined.
      return value === null ? undefined : (value as string);
    },
    async set(key: string, value: unknown) {
      await redis.set(`${REDIS_PREFIX}:${prefix}:${key}`, value as string);
    },
    async del(key: string) {
      await redis.del(`${REDIS_PREFIX}:${prefix}:${key}`);
    },
  };
}

// ─── compatFetch ─────────────────────────────────────────────────────────────
//
// WHY THIS EXISTS
//
// @atproto/oauth-client's dpopFetchWrapper (fetch-dpop.ts) builds a Request
// object internally — new Request(url, init) — where init.duplex is 'half'
// (required by the XRPC layer for streaming bodies, even for small JSON
// payloads). It then calls fetch(request) passing that Request object as the
// sole argument.
//
// In the Vercel production Node.js environment this throws:
//   TypeError: expected non-null body source
//
// The error comes from undici's extractBody, which is called when fetch()
// processes the Request object. Something about how that Request was
// constructed with duplex:'half' causes the body's internal `source`
// property to be null in Vercel's runtime, which undici rejects.
//
// The same code works fine in local dev because the dev server's Node.js
// runtime handles the Request object differently.
//
// THE FIX
//
// When the inner fetch is called with a Request object (the only path that
// triggers this), decompose it back into (url, init) with the body read out
// as a plain ArrayBuffer. Calling fetch(url, { body: ArrayBuffer }) avoids
// the problematic Request-object code path entirely.
//
// Consuming the Request body here is safe: dpopFetchWrapper retries are
// built from the original (url, init) arguments, not from the consumed
// Request object.
//
// FUTURE CHECKS
//
// If writes start failing again with "expected non-null body source" after a
// Node.js or @atproto/oauth-client upgrade, check whether the upstream fix
// has landed — specifically whether dpopFetchWrapper now passes (url, init)
// instead of a Request object to its inner fetch. If so, this wrapper can be
// removed and the oauthClient can use the default fetch again.
//
// To diagnose, set DEBUG_DPOP=true in Vercel env vars and redeploy. You
// should see paired log lines for every DPoP-signed request:
//   [dpop-fetch] → POST <url> nonce=<value or (none)>
//   [dpop-fetch] ← <status> DPoP-Nonce=<value> WWW-Auth=<value>
// If the ← line is missing, the inner fetch is still throwing.
// Add the debug logging back to compatFetch to re-enable this.
//
async function compatFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (input instanceof Request) {
    const req = input;
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => { headers[k] = v; });
    const body = req.body ? await req.arrayBuffer() : undefined;
    return globalThis.fetch(req.url, { method: req.method, headers, body });
  }
  return globalThis.fetch(input as RequestInfo, init);
}

// ─── OAuth client ─────────────────────────────────────────────────────────────

export const oauthClient = new NodeOAuthClient({
  clientMetadata: {
    client_name: 'BlueRes Jobs',
    client_id: `${APP_URL}/oauth/client-metadata`,
    client_uri: APP_URL,
    redirect_uris: [`${APP_URL}/api/oauth/callback`],
    scope: 'atproto transition:generic',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    application_type: 'web',
    dpop_bound_access_tokens: true,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stateStore: redisStore('state') as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessionStore: redisStore('session') as any,
  fetch: compatFetch,
  requestLock: requestLocalLock,
});
