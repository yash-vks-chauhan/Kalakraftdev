import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth } from '../../../../lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const idToken = authHeader.slice(7).trim()
    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 401 }
      )
    }

    const decoded = await adminAuth.verifyIdToken(idToken)

    return NextResponse.json(
      { 
        message: 'Hello from secure endpoint',
        authenticated: true,
        uid: decoded.uid,
        email: decoded.email ?? null,
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error?.code?.startsWith?.('auth/')) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    console.error('Secure hello endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
