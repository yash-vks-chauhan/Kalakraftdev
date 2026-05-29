import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { PASSWORD_POLICY_MESSAGE, isStrongPassword } from '../../../../lib/password-policy'
import prisma from '../../../../lib/prisma'
import { consumeRateLimit, getClientIp } from '../../../../lib/rateLimit'
import { clearAuthCookies, getAuthenticatedUser } from '../../../../lib/session-auth'

const CHANGE_WINDOW_MS = 15 * 60 * 1000
const CHANGE_MAX_ATTEMPTS = 10

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clientIp = getClientIp(request)
    const limit = consumeRateLimit(`change-password:${authUser.id}:ip:${clientIp}`, {
      windowMs: CHANGE_WINDOW_MS,
      max: CHANGE_MAX_ATTEMPTS,
    })
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const oldPassword = String(body.oldPassword || '')
    const newPassword = String(body.newPassword || '')
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (!isStrongPassword(newPassword)) {
      return NextResponse.json({ error: PASSWORD_POLICY_MESSAGE }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, passwordHash: true },
    })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const valid = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 403 })
    }

    const newHash = await bcrypt.hash(newPassword, 10)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: authUser.id },
        data: {
          passwordHash: newHash,
          tokenVersion: { increment: 1 },
        },
      }),
      prisma.session.deleteMany({
        where: { userId: authUser.id },
      }),
    ])

    const response = NextResponse.json({ message: 'Password updated' })
    clearAuthCookies(response)
    return response
  } catch (error: any) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
