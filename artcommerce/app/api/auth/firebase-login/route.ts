import { NextRequest, NextResponse } from 'next/server'
import {
  auth as adminAuth,
  isFirebaseAdminConfigured,
} from '../../../../lib/firebase-admin'
import prisma from '../../../../lib/prisma'
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

    if (!isFirebaseAdminConfigured) {
      return NextResponse.json(
        { error: 'Google sign-in is not configured on the server.' },
        { status: 500 }
      )
    }

    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken)
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
