import { NextResponse } from 'next/server'
import {
  clearAuthCookies,
  getRefreshTokenFromRequest,
  rotateRefreshSession,
  setAuthCookies,
  signAccessToken,
} from '../../../../lib/session-auth'
import { consumeRateLimit, getClientIp } from '../../../../lib/rateLimit'

const REFRESH_WINDOW_MS = 5 * 60 * 1000
const MAX_REFRESH_ATTEMPTS_PER_IP = 60

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const limit = consumeRateLimit(`refresh:ip:${clientIp}`, {
      windowMs: REFRESH_WINDOW_MS,
      max: MAX_REFRESH_ATTEMPTS_PER_IP,
    })
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many session refresh attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const refreshToken = getRefreshTokenFromRequest(request)
    if (!refreshToken) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      clearAuthCookies(response)
      return response
    }

    const rotated = await rotateRefreshSession(refreshToken)
    if (!rotated) {
      const response = NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      clearAuthCookies(response)
      return response
    }

    const accessToken = signAccessToken({
      id: rotated.user.id,
      email: rotated.user.email,
      role: rotated.user.role,
    })

    const response = NextResponse.json({ authenticated: true })
    setAuthCookies(response, {
      accessToken,
      refreshToken: rotated.refreshToken,
    })
    return response
  } catch (error) {
    console.error('POST /api/auth/refresh error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
