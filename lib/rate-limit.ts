import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

const redis = url && token ? new Redis({ url, token }) : null
const limiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m'), analytics: true, prefix: 'neotech:api' })
  : null

export async function checkRateLimit(key: string) {
  if (!limiter) return { success: true, remaining: 10, reset: 0 }
  return limiter.limit(key)
}
