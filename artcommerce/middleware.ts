import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
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

function shouldSkipSecurityMiddleware(pathname: string): boolean {
  if (STATIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true
  }

  return STATIC_FILE_PATTERN.test(pathname)
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
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (shouldSkipSecurityMiddleware(pathname)) {
    return NextResponse.next()
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
