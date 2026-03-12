import { SESSION_AUTH_MARKER } from './auth-session-marker'

const allowedOriginEnvs = [process.env.NEXT_PUBLIC_APP_URL, process.env.APP_URL].filter(Boolean) as string[]
const TRUSTED_FETCH_SITES = new Set(['same-origin', 'same-site', 'none'])
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function getHost(value: string): string | null {
  try {
    return new URL(value).host
  } catch {
    return null
  }
}

function isAllowedHost(originHost: string, requestHost: string): boolean {
  if (originHost === requestHost) return true

  for (const allowed of allowedOriginEnvs) {
    const allowedHost = getHost(allowed)
    if (allowedHost === originHost) {
      return true
    }
  }

  return false
}

function hasSessionCookies(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || ''
  return /(?:^|;\s*)(token|refreshToken)=/.test(cookieHeader)
}

function hasBearerAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || ''
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim()
  return Boolean(bearer) && bearer !== SESSION_AUTH_MARKER
}

/**
 * Basic origin/referrer check to reduce CSRF risk for cookie-authenticated requests.
 * Allows:
 *   - Same host as the request URL
 *   - Hosts that match NEXT_PUBLIC_APP_URL or APP_URL (if set)
 */
export function isAllowedOrigin(request: Request): boolean {
  if (!MUTATING_METHODS.has((request.method || 'GET').toUpperCase())) {
    return true
  }

  const secFetchSite = (request.headers.get('sec-fetch-site') || '').toLowerCase()
  if (secFetchSite && !TRUSTED_FETCH_SITES.has(secFetchSite)) {
    return false
  }

  const requestHost = getHost(request.url)
  if (!requestHost) {
    return false
  }

  const originHeader = request.headers.get('origin')
  if (originHeader) {
    const originHost = getHost(originHeader)
    return originHost ? isAllowedHost(originHost, requestHost) : false
  }

  const refererHeader = request.headers.get('referer')
  if (refererHeader) {
    const refererHost = getHost(refererHeader)
    return refererHost ? isAllowedHost(refererHost, requestHost) : false
  }

  if (hasSessionCookies(request) && !hasBearerAuth(request)) {
    if (secFetchSite) {
      return TRUSTED_FETCH_SITES.has(secFetchSite)
    }
    return false
  }

  return true
}
