import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // This is a test endpoint for Firebase auth
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // For now, just return a success response
    // In production, you might want to verify the Firebase token here
    return NextResponse.json(
      { 
        message: 'Hello from secure endpoint',
        authenticated: true 
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Secure hello endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
