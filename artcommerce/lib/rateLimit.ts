type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

type RateLimitConfig = {
  windowMs: number
  max: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

function cleanupExpired(now: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key)
    }
  }
}

export function consumeRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()

  // Keep memory usage bounded for long-lived node processes.
  if (buckets.size > 5000) {
    cleanupExpired(now)
  }

  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: Math.max(0, config.max - 1),
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    }
  }

  if (current.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  buckets.set(key, current)
  return {
    allowed: true,
    remaining: Math.max(0, config.max - current.count),
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  }
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const [first] = xff.split(',')
    if (first?.trim()) return first.trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}
