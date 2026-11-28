import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

// Separa los contadores de producción, desarrollo y cada rama Preview.
const vercelEnvironment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development'
const previewBranch = vercelEnvironment === 'preview'
  ? (process.env.VERCEL_GIT_COMMIT_REF ?? 'preview')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 64)
  : 'shared'
const limiterPrefix = `neotech:api:${vercelEnvironment}:${previewBranch}`

const redis = url && token ? new Redis({ url, token }) : null
const limiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: limiterPrefix,
    })
  : null

export async function checkRateLimit(key: string) {
  if (!limiter) {
    if (process.env.NODE_ENV === 'production') return { success: false, remaining: 0, reset: Date.now() + 60_000 }
    return { success: true, remaining: 10, reset: 0 }
  }
  try { return await limiter.limit(key) } catch (error) {
    console.error('[v0] rate limit unavailable', error)
    if (process.env.NODE_ENV === 'production') return { success: false, remaining: 0, reset: Date.now() + 60_000 }
    return { success: true, remaining: 10, reset: 0 }
  }
}
