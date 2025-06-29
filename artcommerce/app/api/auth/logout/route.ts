import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Create response to clear the token cookie
    const response = NextResponse.json({ success: true })

    // Clear the token cookie
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
    })

    return response
  } catch (err) {
    console.error('POST /api/auth/logout error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 