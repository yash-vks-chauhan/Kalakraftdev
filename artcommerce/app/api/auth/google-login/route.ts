import { NextRequest, NextResponse } from 'next/server'
import {
  FirebaseTokenVerificationError,
  verifyFirebaseIdToken,
} from '../../../../lib/firebase-id-token'
import prisma from '../../../../lib/prisma'
import { consumeRateLimit, getClientIp } from '../../../../lib/rateLimit'
import { isAllowedOrigin } from '../../../../lib/security'
import {
  createRefreshSession,
  setAuthCookies,
  signAccessToken,
} from '../../../../lib/session-auth'

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

export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const clientIp = getClientIp(req)
  const limit = consumeRateLimit(`google-login:ip:${clientIp}`, {
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
    const firebaseIdToken = String(body.firebaseIdToken || '').trim()

    if (!firebaseIdToken) {
      return NextResponse.json({ error: 'Firebase ID token is required' }, { status: 400 })
    }

    let decodedToken
    try {
      decodedToken = await verifyFirebaseIdToken(firebaseIdToken)
    } catch (error) {
      if (error instanceof FirebaseTokenVerificationError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }

      console.error('Google login token verification error:', error)
      return NextResponse.json(
        { error: 'Could not verify Firebase login token' },
        { status: 500 },
      )
    }

    const email = decodedToken.email?.toLowerCase()
    const isEmailVerified = decodedToken.email_verified === true

    if (!email || !isEmailVerified) {
      return NextResponse.json(
        { error: 'Google account email must be verified' },
        { status: 403 }
      )
    }

    if (!isEmailDomainAllowed(email)) {
      return NextResponse.json({ error: 'Email domain is not allowed' }, { status: 403 })
    }

    let userFromDb = await prisma.user.findUnique({ where: { email } })
    if (!userFromDb) {
      userFromDb = await prisma.user.create({
        data: {
          email,
          fullName: decodedToken.name || email,
          role: 'user',
          avatarUrl: decodedToken.picture || null,
        },
      })
    }

    const accessToken = signAccessToken({
      id: userFromDb.id,
      email: userFromDb.email,
      role: userFromDb.role,
      sessionVersion: userFromDb.sessionVersion,
    })
    const refresh = await createRefreshSession(userFromDb.id)

    const response = NextResponse.json(
      {
        user: {
          id: userFromDb.id,
          fullName: userFromDb.fullName,
          email: userFromDb.email,
          avatarUrl: userFromDb.avatarUrl,
          role: userFromDb.role,
        },
      },
      { status: 200 }
    )

    setAuthCookies(response, {
      accessToken,
      refreshToken: refresh.refreshToken,
    })

    return response
  } catch (error) {
    console.error('Error in /api/auth/google-login:', error)
    return NextResponse.json(
      { error: 'Google login failed while creating or loading the account' },
      { status: 500 },
    )
  }
}
