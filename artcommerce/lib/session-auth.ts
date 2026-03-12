import { createHash, randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import prisma from './prisma'
import { SESSION_AUTH_MARKER } from './auth-session-marker'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_ISSUER = process.env.JWT_ISSUER || 'artcommerce-api'
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'artcommerce-web'

const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 60 * 60)
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30)

const ACCESS_COOKIE_NAME = 'token'
const REFRESH_COOKIE_NAME = 'refreshToken'

export type AccessTokenPayload = {
  userId: string
  email?: string | null
  role?: string | null
  tokenType?: 'access'
}

type UserForToken = {
  id: string
  email?: string | null
  role?: string | null
}

function ensureJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set')
  }
  return JWT_SECRET
}

function getCookieFromHeader(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function getAccessCookieTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || ''
  return getCookieFromHeader(cookieHeader, ACCESS_COOKIE_NAME)
}

export function getBearerTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || ''
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!bearer || bearer === SESSION_AUTH_MARKER) return null
  return bearer
}

export function getTokenFromRequest(request: Request): string | null {
  return getAccessCookieTokenFromRequest(request) || getBearerTokenFromRequest(request)
}

export function getRefreshTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || ''
  return getCookieFromHeader(cookieHeader, REFRESH_COOKIE_NAME)
}

export function signAccessToken(user: UserForToken): string {
  const secret = ensureJwtSecret()
  return jwt.sign(
    {
      userId: user.id,
      email: user.email || undefined,
      role: user.role || undefined,
      tokenType: 'access',
    },
    secret,
    {
      expiresIn: `${ACCESS_TOKEN_TTL_SECONDS}s`,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      subject: user.id,
    }
  )
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  const secret = ensureJwtSecret()
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as AccessTokenPayload
    if (!decoded?.userId) return null
    return {
      ...decoded,
      userId: String(decoded.userId),
      tokenType: 'access',
    }
  } catch {
    // Backward-compatible fallback for legacy tokens already issued pre-hardening.
    try {
      const decoded = jwt.verify(token, secret) as AccessTokenPayload
      if (!decoded?.userId) return null
      return {
        ...decoded,
        userId: String(decoded.userId),
        tokenType: 'access',
      }
    } catch {
      return null
    }
  }
}

export function verifyRequestAccessToken(request: Request): AccessTokenPayload | null {
  const candidates = [getAccessCookieTokenFromRequest(request), getBearerTokenFromRequest(request)]
    .filter((token): token is string => Boolean(token))
    .filter((token, index, allTokens) => allTokens.indexOf(token) === index)

  for (const token of candidates) {
    const payload = verifyAccessToken(token)
    if (payload?.userId) {
      return payload
    }
  }

  return null
}

function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

function buildRefreshExpiry(): Date {
  const ms = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  return new Date(Date.now() + ms)
}

function generateRefreshTokenValue(): string {
  return randomBytes(48).toString('hex')
}

export async function createRefreshSession(userId: string): Promise<{
  refreshToken: string
  expiresAt: Date
}> {
  const refreshToken = generateRefreshTokenValue()
  const expiresAt = buildRefreshExpiry()
  await prisma.session.create({
    data: {
      userId,
      sessionToken: hashRefreshToken(refreshToken),
      expires: expiresAt,
    },
  })
  return { refreshToken, expiresAt }
}

export async function rotateRefreshSession(rawRefreshToken: string): Promise<{
  user: UserForToken
  refreshToken: string
  expiresAt: Date
} | null> {
  const currentHash = hashRefreshToken(rawRefreshToken)
  const existing = await prisma.session.findUnique({
    where: { sessionToken: currentHash },
    include: {
      user: {
        select: { id: true, email: true, role: true },
      },
    },
  })

  if (!existing || existing.expires <= new Date() || !existing.user) {
    if (existing) {
      await prisma.session.delete({ where: { id: existing.id } }).catch(() => undefined)
    }
    return null
  }

  const newRefreshToken = generateRefreshTokenValue()
  const newExpiry = buildRefreshExpiry()

  await prisma.$transaction([
    prisma.session.delete({ where: { id: existing.id } }),
    prisma.session.create({
      data: {
        userId: existing.user.id,
        sessionToken: hashRefreshToken(newRefreshToken),
        expires: newExpiry,
      },
    }),
  ])

  return {
    user: existing.user,
    refreshToken: newRefreshToken,
    expiresAt: newExpiry,
  }
}

export async function revokeRefreshSession(rawRefreshToken: string | null): Promise<void> {
  if (!rawRefreshToken) return
  const tokenHash = hashRefreshToken(rawRefreshToken)
  await prisma.session.deleteMany({
    where: { sessionToken: tokenHash },
  })
}

export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string }
) {
  const secure = process.env.NODE_ENV === 'production'
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: tokens.accessToken,
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  })

  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: tokens.refreshToken,
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  })
}

export function clearAuthCookies(response: NextResponse) {
  const secure = process.env.NODE_ENV === 'production'
  const expired = {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }
  response.cookies.set('token', '', expired)
  response.cookies.set('refreshToken', '', {
    ...expired,
    sameSite: 'strict',
  })
}

export async function getAuthenticatedUser(request: Request): Promise<UserForToken | null> {
  const payload = verifyRequestAccessToken(request)
  if (!payload?.userId) return null

  const user = await prisma.user.findUnique({
    where: { id: String(payload.userId) },
    select: { id: true, email: true, role: true },
  })
  return user || null
}

export async function requireAdminUser(request: Request): Promise<UserForToken | null> {
  const user = await getAuthenticatedUser(request)
  if (!user || user.role !== 'admin') return null
  return user
}

export { ACCESS_TOKEN_TTL_SECONDS }
