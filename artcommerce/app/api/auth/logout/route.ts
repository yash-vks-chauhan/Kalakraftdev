import { NextResponse } from 'next/server'
import {
  clearAuthCookies,
  getRefreshTokenFromRequest,
  revokeRefreshSession,
} from '../../../../lib/session-auth'

export async function POST(request: Request) {
  try {
    const refreshToken = getRefreshTokenFromRequest(request)
    await revokeRefreshSession(refreshToken)

    const response = NextResponse.json({ success: true })
    clearAuthCookies(response)

    // Keep clearing legacy auth cookies for backward compatibility.
    response.cookies.delete('session')
    response.cookies.delete('next-auth.session-token')
    response.cookies.delete('__Secure-next-auth.session-token')
    response.cookies.delete('__Host-next-auth.session-token')
    return response
  } catch (error) {
    console.error('POST /api/auth/logout error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
