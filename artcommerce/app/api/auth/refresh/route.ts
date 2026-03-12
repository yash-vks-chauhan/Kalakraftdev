import { NextResponse } from 'next/server'
import {
  getRefreshTokenFromRequest,
  rotateRefreshSession,
  setAuthCookies,
  signAccessToken,
} from '../../../../lib/session-auth'
import { isAllowedOrigin } from '../../../../lib/security'

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const refreshToken = getRefreshTokenFromRequest(request)
    if (!refreshToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rotated = await rotateRefreshSession(refreshToken)
    if (!rotated) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const accessToken = signAccessToken({
      id: rotated.user.id,
      email: rotated.user.email,
      role: rotated.user.role,
      sessionVersion: rotated.user.sessionVersion,
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
