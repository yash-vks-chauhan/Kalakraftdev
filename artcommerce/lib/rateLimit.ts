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

const TRUSTED_IP_HEADERS = [
  'cf-connecting-ip',
  'x-vercel-forwarded-for',
  'fly-client-ip',
  'fastly-client-ip',
  'x-real-ip',
  'x-forwarded-for',
]

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

function normalizeClientIp(raw: string | null): string | null {
  if (!raw) return null

  const candidate = raw.split(',')[0]?.trim()
  if (!candidate) return null

  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(candidate)) {
    return candidate.replace(/:\d+$/, '')
  }

  if (candidate.startsWith('[')) {
    const closingBracket = candidate.indexOf(']')
    if (closingBracket > 0) {
      return candidate.slice(1, closingBracket)
    }
  }

  return /^[A-Fa-f0-9:.]+$/.test(candidate) ? candidate : null
}

export function getClientIp(request: Request): string {
  for (const header of TRUSTED_IP_HEADERS) {
    const normalized = normalizeClientIp(request.headers.get(header))
    if (normalized) {
      return normalized
    }
  }

  return 'unknown'
}

export function clearRateLimit(key: string) {
  buckets.delete(key)
}
