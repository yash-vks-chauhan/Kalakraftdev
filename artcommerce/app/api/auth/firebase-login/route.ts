import { NextRequest, NextResponse } from 'next/server'
import {
  auth as adminAuth,
  isFirebaseAdminConfigured,
} from '../../../../lib/firebase-admin'
import prisma from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'
import { consumeRateLimit, getClientIp } from '../../../../lib/rateLimit'
import {
  createRefreshSession,
  setAuthCookies,
  signAccessToken,
} from '../../../../lib/session-auth'

export const runtime = 'nodejs'

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS_PER_IP = 25
const allowedDomains = (process.env.AUTH_EMAIL_ALLOWLIST_DOMAINS || '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean)
const FIREBASE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'

type VerifiedFirebaseToken = {
  uid: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

let firebaseCertCache:
  | {
      certs: Record<string, string>
      expiresAt: number
    }
  | null = null

function isEmailDomainAllowed(email: string): boolean {
  if (!allowedDomains.length) return true
  const domain = email.split('@')[1]?.toLowerCase() || ''
  return allowedDomains.includes(domain)
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error || '')
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error && 'code' in error) {
    return String((error as { code?: unknown }).code || '')
  }
  return undefined
}

function getExpectedFirebaseProjectId(): string {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    ''
  ).trim()
}

function getCertCacheMaxAge(cacheControl: string | null): number {
  const match = cacheControl?.match(/max-age=(\d+)/i)
  if (!match) return 60 * 60 * 1000
  return Number(match[1]) * 1000
}

async function getFirebasePublicCerts(): Promise<Record<string, string>> {
  if (firebaseCertCache && firebaseCertCache.expiresAt > Date.now()) {
    return firebaseCertCache.certs
  }

  const response = await fetch(FIREBASE_CERTS_URL, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`Could not load Firebase public certificates: ${response.status}`)
  }

  const certs = (await response.json()) as Record<string, string>
  firebaseCertCache = {
    certs,
    expiresAt: Date.now() + getCertCacheMaxAge(response.headers.get('cache-control')),
  }
  return certs
}

async function verifyFirebaseIdTokenWithPublicCerts(
  idToken: string
): Promise<VerifiedFirebaseToken> {
  const projectId = getExpectedFirebaseProjectId()
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set')
  }

  const decoded = jwt.decode(idToken, { complete: true })
  const kid = decoded && typeof decoded === 'object' ? decoded.header?.kid : undefined
  const alg = decoded && typeof decoded === 'object' ? decoded.header?.alg : undefined

  if (!kid || alg !== 'RS256') {
    throw new Error('Firebase token header is invalid')
  }

  const certs = await getFirebasePublicCerts()
  const cert = certs[kid]
  if (!cert) {
    firebaseCertCache = null
    throw new Error('Firebase token certificate was not found')
  }

  const payload = jwt.verify(idToken, cert, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  }) as jwt.JwtPayload

  const uid = String(payload.sub || '')
  if (!uid || uid.length > 128) {
    throw new Error('Firebase token subject is invalid')
  }

  return {
    uid,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    email_verified: payload.email_verified === true,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
  }
}

async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseToken> {
  if (isFirebaseAdminConfigured) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken)
      return {
        uid: decoded.uid,
        email: decoded.email,
        email_verified: decoded.email_verified,
        name: decoded.name,
        picture: decoded.picture,
      }
    } catch (verifyError) {
      console.error('Firebase Admin ID token verification failed:', {
        code: getErrorCode(verifyError),
        message: getErrorMessage(verifyError),
      })
    }
  }

  return verifyFirebaseIdTokenWithPublicCerts(idToken)
}

function getServerLoginError(error: unknown): string {
  const message = getErrorMessage(error)

  if (
    message.includes('JWT_SECRET') ||
    message.includes('DATABASE_URL') ||
    message.includes('Prisma') ||
    message.includes('Firebase Admin')
  ) {
    return 'Server authentication is not configured correctly. Please check the deployment environment variables.'
  }

  return 'Could not complete Google sign-in. Please try again.'
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req)
  const limit = consumeRateLimit(`firebase-login:ip:${clientIp}`, {
    windowMs: LOGIN_WINDOW_MS,
    max: MAX_ATTEMPTS_PER_IP,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const idToken = String(body.idToken || '').trim()
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 })
    }

    let decodedToken: VerifiedFirebaseToken
    try {
      decodedToken = await verifyFirebaseIdToken(idToken)
    } catch (verifyError) {
      console.error('Firebase ID token verification failed:', {
        code: getErrorCode(verifyError),
        message: getErrorMessage(verifyError),
      })
      return NextResponse.json(
        {
          error:
            'Google sign-in token could not be verified. Check that Firebase client and server credentials use the same project.',
        },
        { status: 401 }
      )
    }

    const email = decodedToken.email?.toLowerCase()
    const isEmailVerified = decodedToken.email_verified === true

    if (!email || !isEmailVerified) {
      return NextResponse.json(
        { error: 'Account email must be verified' },
        { status: 403 }
      )
    }

    if (!isEmailDomainAllowed(email)) {
      return NextResponse.json({ error: 'Email domain is not allowed' }, { status: 403 })
    }

    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName: decodedToken.name || email,
          role: 'user',
          avatarUrl: decodedToken.picture || null,
        },
      })
    }

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })
    const refresh = await createRefreshSession(user.id)

    const response = NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    })

    setAuthCookies(response, {
      accessToken,
      refreshToken: refresh.refreshToken,
    })

    return response
  } catch (error) {
    console.error('Firebase login error:', error)
    return NextResponse.json({ error: getServerLoginError(error) }, { status: 500 })
  }
}
