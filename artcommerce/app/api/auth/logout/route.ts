import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Create response with success message
    const response = NextResponse.json({ success: true })

    // Clear all auth-related cookies
    response.cookies.delete('token')
    response.cookies.delete('session')
    response.cookies.delete('next-auth.session-token')
    response.cookies.delete('__Secure-next-auth.session-token')
    response.cookies.delete('__Host-next-auth.session-token')

    // Also set them to expire immediately as a backup
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0
    }

    response.cookies.set('token', '', cookieOptions)
    response.cookies.set('session', '', cookieOptions)
    response.cookies.set('next-auth.session-token', '', cookieOptions)
    response.cookies.set('__Secure-next-auth.session-token', '', cookieOptions)
    response.cookies.set('__Host-next-auth.session-token', '', cookieOptions)

    return response
  } catch (err) {
    console.error('POST /api/auth/logout error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 