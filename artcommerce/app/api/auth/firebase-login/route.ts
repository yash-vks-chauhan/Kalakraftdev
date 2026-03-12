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

    let decodedToken
    try {
      decodedToken = await verifyFirebaseIdToken(idToken)
    } catch (error) {
      if (error instanceof FirebaseTokenVerificationError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }

      console.error('Firebase token verification error:', error)
      return NextResponse.json(
        { error: 'Could not verify Firebase login token' },
        { status: 500 },
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
      sessionVersion: user.sessionVersion,
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
    return NextResponse.json(
      { error: 'Google login failed while creating or loading the account' },
      { status: 500 },
    )
  }
}
