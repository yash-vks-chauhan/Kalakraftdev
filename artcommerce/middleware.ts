import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  areAllowedCorsHeaders,
  getAllowedCorsOrigin,
  isAllowedCorsMethod,
  isAllowedOrigin,
  isMutationMethod,
  isSensitiveApiPath,
  isSensitivePagePath,
} from './lib/security'

const STATIC_PATH_PREFIXES = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/robots.txt',
  '/sitemap.xml',
]

const STATIC_FILE_PATTERN =
  /\.(?:avif|css|gif|ico|jpeg|jpg|js|map|mp3|mp4|png|svg|txt|webm|webp|woff2?)$/i

function getCanonicalOrigin(): string | null {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  if (!configuredUrl) return null

  try {
    return new URL(configuredUrl).origin
  } catch {
    return null
  }
}

function shouldRedirectToCanonicalHost(request: NextRequest): boolean {
  if (process.env.VERCEL_ENV !== 'production') return false

  const canonicalOrigin = getCanonicalOrigin()
  if (!canonicalOrigin) return false

  const canonicalHost = new URL(canonicalOrigin).host
  const requestHost = request.nextUrl.host
  if (requestHost === canonicalHost) return false

  return requestHost.endsWith('.vercel.app')
}

function shouldSkipSecurityMiddleware(pathname: string): boolean {
  if (STATIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true
  }

  return STATIC_FILE_PATTERN.test(pathname)
}

function appendVary(currentValue: string | null, value: string): string {
  const values = new Set(
    (currentValue || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )
  values.add(value)
  return Array.from(values).join(', ')
}

function applyCorsHeaders(response: NextResponse, request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', request.nextUrl.origin)
    response.headers.set('Vary', appendVary(response.headers.get('Vary'), 'Origin'))
    return
  }

  const allowedOrigin = getAllowedCorsOrigin(request)
  response.headers.set('Vary', appendVary(response.headers.get('Vary'), 'Origin'))

  if (!allowedOrigin) {
    response.headers.delete('Access-Control-Allow-Origin')
    response.headers.delete('Access-Control-Allow-Credentials')
    response.headers.delete('Access-Control-Allow-Methods')
    response.headers.delete('Access-Control-Allow-Headers')
    return
  }

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Accept, Authorization, Content-Type, X-Requested-With, X-Pusher-Socket-Id'
  )
}

function applySharedHeaders(response: NextResponse, request: NextRequest) {
  const pathname = request.nextUrl.pathname

  response.headers.set(
    'Cross-Origin-Opener-Policy',
    pathname.startsWith('/auth') ? 'unsafe-none' : 'same-origin-allow-popups'
  )
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site')
  response.headers.set('Origin-Agent-Cluster', '?1')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

  if (pathname.startsWith('/api')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  if (
    isSensitiveApiPath(pathname) ||
    isSensitivePagePath(pathname) ||
    (pathname.startsWith('/api') && isMutationMethod(request.method))
  ) {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  applyCorsHeaders(response, request)
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (shouldRedirectToCanonicalHost(request)) {
    const redirectUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, getCanonicalOrigin()!)
    return NextResponse.redirect(redirectUrl, 308)
  }

  if (shouldSkipSecurityMiddleware(pathname)) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api') && request.method.toUpperCase() === 'OPTIONS') {
    const isValidPreflight =
      Boolean(getAllowedCorsOrigin(request)) &&
      isAllowedCorsMethod(request.headers.get('access-control-request-method')) &&
      areAllowedCorsHeaders(request.headers.get('access-control-request-headers'))

    const response = new NextResponse(null, { status: isValidPreflight ? 204 : 403 })
    applySharedHeaders(response, request)
    return response
  }

  if (pathname.startsWith('/api') && isMutationMethod(request.method) && !isAllowedOrigin(request)) {
    const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    applySharedHeaders(response, request)
    return response
  }

  const response = NextResponse.next()
  applySharedHeaders(response, request)
  return response
}

export const config = {
  matcher: ['/:path*'],
}
