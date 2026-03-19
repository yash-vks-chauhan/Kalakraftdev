import { createHash, randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import prisma from './prisma'
import { SESSION_AUTH_MARKER } from './auth-session-marker'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_SECRET_PREVIOUS = process.env.JWT_SECRET_PREVIOUS
const JWT_ISSUER = process.env.JWT_ISSUER || 'artcommerce-api'
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'artcommerce-web'
const JWT_ALGORITHM = 'HS256' as const

const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 60 * 60)
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30)
const MAX_ACTIVE_REFRESH_SESSIONS = Math.max(1, Number(process.env.MAX_ACTIVE_REFRESH_SESSIONS || 5))
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const PRIMARY_ACCESS_COOKIE_NAME = IS_PRODUCTION ? '__Host-token' : 'token'
const PRIMARY_REFRESH_COOKIE_NAME = IS_PRODUCTION ? '__Host-refreshToken' : 'refreshToken'
const LEGACY_ACCESS_COOKIE_NAME = 'token'
const LEGACY_REFRESH_COOKIE_NAME = 'refreshToken'
const ACCESS_COOKIE_NAMES = Array.from(new Set([PRIMARY_ACCESS_COOKIE_NAME, LEGACY_ACCESS_COOKIE_NAME]))
const REFRESH_COOKIE_NAMES = Array.from(new Set([PRIMARY_REFRESH_COOKIE_NAME, LEGACY_REFRESH_COOKIE_NAME]))

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

function getJwtSecrets(): string[] {
  return Array.from(new Set([ensureJwtSecret(), JWT_SECRET_PREVIOUS].filter(Boolean) as string[]))
}

function getCookieFromHeader(cookieHeader: string, names: string | string[]): string | null {
  const candidates = Array.isArray(names) ? names : [names]

  for (const name of candidates) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escapedName}=([^;]+)`))
    if (match) {
      return decodeURIComponent(match[1])
    }
  }

  return null
}

export function getAccessCookieTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || ''
  return getCookieFromHeader(cookieHeader, ACCESS_COOKIE_NAMES)
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
  return getCookieFromHeader(cookieHeader, REFRESH_COOKIE_NAMES)
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
      algorithm: JWT_ALGORITHM,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      subject: user.id,
    }
  )
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  for (const secret of getJwtSecrets()) {
    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: [JWT_ALGORITHM],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      }) as AccessTokenPayload
      if (!decoded?.userId) continue
      return {
        ...decoded,
        userId: String(decoded.userId),
        tokenType: 'access',
      }
    } catch {
      // Continue so we can support secret rotation or older deployed secrets.
    }
  }

  for (const secret of getJwtSecrets()) {
    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: [JWT_ALGORITHM],
      }) as AccessTokenPayload
      if (!decoded?.userId) continue
      return {
        ...decoded,
        userId: String(decoded.userId),
        tokenType: 'access',
      }
    } catch {
      // Backward-compatible fallback for legacy tokens already issued pre-hardening.
    }
  }

  return null
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

async function pruneUserRefreshSessions(userId: string) {
  const now = new Date()

  await prisma.session.deleteMany({
    where: {
      userId,
      expires: { lte: now },
    },
  })

  const staleSessions = await prisma.session.findMany({
    where: { userId },
    orderBy: [{ expires: 'desc' }, { id: 'desc' }],
    skip: MAX_ACTIVE_REFRESH_SESSIONS,
    select: { id: true },
  })

  if (staleSessions.length > 0) {
    await prisma.session.deleteMany({
      where: {
        id: {
          in: staleSessions.map((session) => session.id),
        },
      },
    })
  }
}

export async function createRefreshSession(userId: string): Promise<{
  refreshToken: string
  expiresAt: Date
}> {
  const refreshToken = generateRefreshTokenValue()
  const expiresAt = buildRefreshExpiry()
  await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({
      where: {
        userId,
        expires: { lte: new Date() },
      },
    })

    await tx.session.create({
      data: {
        userId,
        sessionToken: hashRefreshToken(refreshToken),
        expires: expiresAt,
      },
    })
  })

  await pruneUserRefreshSessions(userId)
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

  await pruneUserRefreshSessions(existing.user.id)

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
  response.cookies.set({
    name: PRIMARY_ACCESS_COOKIE_NAME,
    value: tokens.accessToken,
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
    priority: 'high',
  })

  response.cookies.set({
    name: PRIMARY_REFRESH_COOKIE_NAME,
    value: tokens.refreshToken,
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict',
    path: '/',
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
    priority: 'medium',
  })
}

export function clearAuthCookies(response: NextResponse) {
  const accessCookieOptions = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }

  const refreshCookieOptions = {
    ...accessCookieOptions,
    sameSite: 'strict' as const,
  }

  for (const name of ACCESS_COOKIE_NAMES) {
    response.cookies.set(name, '', accessCookieOptions)
  }

  for (const name of REFRESH_COOKIE_NAMES) {
    response.cookies.set(name, '', refreshCookieOptions)
  }
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
export function getAccessCookieNames(): string[] {
  return ACCESS_COOKIE_NAMES
}
