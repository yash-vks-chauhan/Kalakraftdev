import { NextResponse } from 'next/server'
import pusher from '../../../../lib/pusher'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

function getAuthFromRequest(request: Request): { userId: number; role: string } | null {
  // 1) Try Authorization header
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''
  let token = bearer

  // 2) Fallback to cookie named "token"
  if (!token) {
    const cookie = request.headers.get('cookie') || ''
    const match = cookie.match(/(?:^|;\s*)token=([^;]+)/)
    if (match) token = decodeURIComponent(match[1])
  }

  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    return { userId: payload.userId, role: payload.role }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { socket_id?: string; channel_name?: string } | null
    if (!body || !body.socket_id || !body.channel_name) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const auth = getAuthFromRequest(request)
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow private admin channel
    if (!body.channel_name.startsWith('private-admin')) {
      return NextResponse.json({ error: 'Forbidden channel' }, { status: 403 })
    }

    const response = pusher.authorizeChannel(body.socket_id, body.channel_name)
    return NextResponse.json(response)
  } catch (err) {
    return NextResponse.json({ error: 'Auth error' }, { status: 500 })
  }
}

