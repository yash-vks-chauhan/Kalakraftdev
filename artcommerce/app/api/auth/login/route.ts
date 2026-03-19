// File: app/api/auth/login/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { consumeRateLimit, getClientIp } from '../../../../lib/rateLimit'
import {
  createRefreshSession,
  setAuthCookies,
  signAccessToken,
} from '../../../../lib/session-auth'

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_MAX_ATTEMPTS_PER_IP = 30
const LOGIN_MAX_ATTEMPTS_PER_EMAIL = 10
const DUMMY_PASSWORD_HASH = '$2b$10$7s4jH2VvFQ3cyLHPZ4Jkxu6rQ6K8A1glnH8JwW4u8cW4Rr2pL2u3a'

async function comparePasswordSafely(password: string, passwordHash?: string | null): Promise<boolean> {
  const hashToCompare = passwordHash || DUMMY_PASSWORD_HASH

  try {
    const matched = await bcrypt.compare(password, hashToCompare)
    return Boolean(passwordHash) && matched
  } catch (err) {
    console.error('Password comparison error:', err)
    return false
  }
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request)
  const ipLimit = consumeRateLimit(`login:ip:${clientIp}`, {
    windowMs: LOGIN_WINDOW_MS,
    max: LOGIN_MAX_ATTEMPTS_PER_IP,
  })
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    let email: string
    let password: string
    try {
      const body = await request.json()
      email = String(body.email || '').trim().toLowerCase()
      password = String(body.password || '')
    } catch {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Please enter your email' }, { status: 400 })
    }
    if (!password) {
      return NextResponse.json({ error: 'Please enter your password' }, { status: 400 })
    }

    const emailLimit = consumeRateLimit(`login:email:${email}:ip:${clientIp}`, {
      windowMs: LOGIN_WINDOW_MS,
      max: LOGIN_MAX_ATTEMPTS_PER_EMAIL,
    })
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        role: true,
        passwordHash: true,
      },
    });

    const isValid = await comparePasswordSafely(password, user?.passwordHash)
    if (!user || !user.passwordHash || typeof user.passwordHash !== 'string' || !isValid) {
      return NextResponse.json(
        { error: 'The email or password you entered is incorrect' },
        { status: 401 }
      )
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
  } catch (err) {
    console.error('POST /api/auth/login error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
