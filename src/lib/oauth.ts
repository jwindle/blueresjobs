import { NodeOAuthClient, requestLocalLock } from '@atproto/oauth-client-node';
import { Redis } from '@upstash/redis';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const REDIS_PREFIX = process.env.REDIS_PREFIX ?? 'blueresjobs';
const DEBUG_DPOP = process.env.DEBUG_DPOP === 'true';

function redisStore(prefix: string) {
  return {
    async get(key: string) {
      const redisKey = `${REDIS_PREFIX}:${prefix}:${key}`;
      const value = await redis.get(redisKey);
      if (DEBUG_DPOP && prefix === 'dpop-nonce') {
        console.log(`[dpop-nonce] get ${redisKey} →`, value === null ? 'null (missing)' : value);
      }
      // Redis returns null for missing keys; SimpleStore expects undefined
      return value === null ? undefined : (value as string);
    },
    async set(key: string, value: unknown) {
      const redisKey = `${REDIS_PREFIX}:${prefix}:${key}`;
      if (DEBUG_DPOP && prefix === 'dpop-nonce') {
        console.log(`[dpop-nonce] set ${redisKey} →`, value);
      }
      await redis.set(redisKey, value as string);
    },
    async del(key: string) {
      await redis.del(`${REDIS_PREFIX}:${prefix}:${key}`);
    },
  };
}

console.log(`[oauth] USE_REDIS_DPOP_NONCE=${process.env.USE_REDIS_DPOP_NONCE} DEBUG_DPOP=${process.env.DEBUG_DPOP}`);

// The @atproto dpopFetchWrapper passes a Request object to the inner fetch.
// In some Node.js/Vercel environments this triggers "expected non-null body source"
// from undici when the request was constructed with duplex:'half'. Decomposing the
// Request back into (url, init) with a plain ArrayBuffer body avoids that path.
async function compatFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (input instanceof Request) {
    const req = input;
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => { headers[k] = v; });
    const body = req.body ? await req.arrayBuffer() : undefined;

    if (DEBUG_DPOP) {
      try {
        const dpop = headers['dpop'];
        const payload = dpop ? JSON.parse(atob(dpop.split('.')[1])) : null;
        console.log(`[dpop-fetch] → ${req.method} ${req.url} nonce=${payload?.nonce ?? '(none)'}`);
      } catch {
        console.log(`[dpop-fetch] → ${req.method} ${req.url} (could not decode DPoP)`);
      }
    }

    const res = await globalThis.fetch(req.url, { method: req.method, headers, body });

    if (DEBUG_DPOP) {
      console.log(`[dpop-fetch] ← ${res.status} DPoP-Nonce=${res.headers.get('DPoP-Nonce') ?? '(none)'} WWW-Auth=${res.headers.get('WWW-Authenticate') ?? '(none)'}`);
    }

    return res;
  }
  return globalThis.fetch(input as RequestInfo, init);
}

const useRedisNonce = process.env.USE_REDIS_DPOP_NONCE === 'true';
const dpopNonceStore = useRedisNonce ? redisStore('dpop-nonce') : undefined;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...(dpopNonceStore && { dpopNonceCache: dpopNonceStore as any }),
  fetch: compatFetch,
  requestLock: requestLocalLock,
});
