// File: app/api/auth/signup/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { PASSWORD_POLICY_MESSAGE, isStrongPassword } from '../../../../lib/password-policy'
import { consumeRateLimit, getClientIp } from '../../../../lib/rateLimit'
import { isValidEmailAddress } from '../../../../lib/inputValidation'
import {
  createRefreshSession,
  setAuthCookies,
  signAccessToken,
} from '../../../../lib/session-auth'

const SIGNUP_WINDOW_MS = 30 * 60 * 1000
const SIGNUP_MAX_PER_IP = 10
const SIGNUP_MAX_PER_EMAIL = 5

export async function POST(request: Request) {
  const clientIp = getClientIp(request)
  const ipLimit = consumeRateLimit(`signup:ip:${clientIp}`, {
    windowMs: SIGNUP_WINDOW_MS,
    max: SIGNUP_MAX_PER_IP,
  })
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const fullName = String(body.fullName || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!isValidEmailAddress(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const emailLimit = consumeRateLimit(`signup:email:${email}:ip:${clientIp}`, {
      windowMs: SIGNUP_WINDOW_MS,
      max: SIGNUP_MAX_PER_EMAIL,
    })
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      )
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json({ error: PASSWORD_POLICY_MESSAGE }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { fullName, email, passwordHash, role: 'user' },
      select: { id: true, fullName: true, email: true, avatarUrl: true, role: true, tokenVersion: true }
    })

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    })
    const refresh = await createRefreshSession(user.id)

    const { tokenVersion: _tokenVersion, ...safeUser } = user
    const response = NextResponse.json({ user: safeUser })

    setAuthCookies(response, {
      accessToken,
      refreshToken: refresh.refreshToken,
    })

    return response
  } catch (err) {
    console.error('POST /api/auth/signup error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
