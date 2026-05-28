const allowedOriginEnvs = [process.env.NEXT_PUBLIC_APP_URL, process.env.APP_URL].filter(Boolean) as string[]

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

const SENSITIVE_API_PREFIXES = [
  '/api/admin',
  '/api/addresses',
  '/api/auth',
  '/api/cart',
  '/api/coupons/redeem',
  '/api/coupons/validate',
  '/api/orders',
  '/api/support',
  '/api/uploads',
  '/api/wishlist',
]

const SENSITIVE_PAGE_PREFIXES = [
  '/checkout',
  '/dashboard',
  '/orders',
  '/support/ticket',
]

function getAllowedOriginHosts(): string[] {
  return allowedOriginEnvs.flatMap((allowed) => {
    try {
      return [new URL(allowed).host]
    } catch {
      return []
    }
  })
}

/**
 * Basic origin/referrer check to reduce CSRF risk for browser-initiated requests.
 * Allows:
 *   - Same host as the request URL
 *   - Hosts that match NEXT_PUBLIC_APP_URL or APP_URL (if set)
 *   - Non-browser clients without cookies that omit Origin / Referer / Sec-Fetch-Site
 */
export function isAllowedOrigin(request: Request): boolean {
  const requestHost = new URL(request.url).host
  const originHeader = request.headers.get('origin') || request.headers.get('referer')
  const fetchSite = (request.headers.get('sec-fetch-site') || '').toLowerCase()

  if (!originHeader) {
    const allowedFetchMetadata = fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none'
    if (request.headers.get('cookie')) return allowedFetchMetadata
    return fetchSite === '' || allowedFetchMetadata
  }

  let originHost: string
  try {
    originHost = new URL(originHeader).host
  } catch {
    return false
  }

  if (originHost === requestHost) return true

  return getAllowedOriginHosts().includes(originHost)
}

export function isMutationMethod(method: string): boolean {
  return MUTATION_METHODS.has(method.toUpperCase())
}

export function isSensitiveApiPath(pathname: string): boolean {
  return SENSITIVE_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function isSensitivePagePath(pathname: string): boolean {
  return SENSITIVE_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
