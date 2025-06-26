// Example: app/api/secure/route.ts
import { NextResponse }   from 'next/server'
import { auth as adminAuth } from '../../../lib/firebase-admin'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const idToken = auth.slice(7)
    const decoded = await adminAuth.verifyIdToken(idToken)
    return NextResponse.json({ ok: true, uid: decoded.uid, email: decoded.email })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}