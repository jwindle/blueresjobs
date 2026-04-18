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
      return redis.get(`${REDIS_PREFIX}:${prefix}:${key}`);
    },
    async set(key: string, value: unknown) {
      await redis.set(`${REDIS_PREFIX}:${prefix}:${key}`, value);
    },
    async del(key: string) {
      await redis.del(`${REDIS_PREFIX}:${prefix}:${key}`);
    },
  };
}

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
  requestLock: requestLocalLock,
});
