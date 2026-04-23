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

function debugFetch(inner: typeof globalThis.fetch): typeof globalThis.fetch {
  return async function (input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const dpopHeader = init?.headers instanceof Headers
      ? init.headers.get('DPoP')
      : (init?.headers as Record<string, string>)?.['DPoP'];
    if (dpopHeader) {
      try {
        const payload = JSON.parse(atob(dpopHeader.split('.')[1]));
        console.log(`[dpop-fetch] → ${init?.method ?? 'GET'} ${url} nonce=${payload.nonce ?? '(none)'}`);
      } catch {
        console.log(`[dpop-fetch] → ${init?.method ?? 'GET'} ${url} (could not decode DPoP)`);
      }
    }
    const res = await inner.call(this as unknown, input as RequestInfo, init);
    if (dpopHeader) {
      const dpopNonce = res.headers.get('DPoP-Nonce');
      console.log(`[dpop-fetch] ← ${res.status} DPoP-Nonce=${dpopNonce ?? '(none)'} WWW-Auth=${res.headers.get('WWW-Authenticate') ?? '(none)'}`);
    }
    return res;
  } as typeof globalThis.fetch;
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
  ...(DEBUG_DPOP && { fetch: debugFetch(globalThis.fetch) }),
  requestLock: requestLocalLock,
});
