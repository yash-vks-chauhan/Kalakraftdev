import { NextResponse } from 'next/server'
import pusher from '../../../../lib/pusher'
import { isAllowedOrigin } from '../../../../lib/security'
import { requireAdminUser } from '../../../../lib/session-auth'

const ADMIN_CHANNEL = 'private-admin-channel'

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = await requireAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.text()
  const params = new URLSearchParams(body)
  const socketId = params.get('socket_id')
  const channelName = params.get('channel_name')

  if (!socketId || !channelName) {
    return NextResponse.json({ error: 'Invalid auth payload' }, { status: 400 })
  }

  if (channelName !== ADMIN_CHANNEL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const authResponse = await pusher.authorizeChannel(socketId, channelName)
  return NextResponse.json(authResponse)
}
