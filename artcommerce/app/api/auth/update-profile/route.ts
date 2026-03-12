import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { isAllowedOrigin } from '../../../../lib/security'
import { getAuthenticatedUser } from '../../../../lib/session-auth'

export const runtime = 'nodejs'

export async function PATCH(request: Request) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const fullName = String(body.fullName || '').trim()
    const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : undefined

    if (!fullName) {
      return NextResponse.json({ error: 'fullName is required' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        fullName,
        avatarUrl,
      },
      select: { id: true, fullName: true, email: true, avatarUrl: true },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    console.error('PATCH /api/auth/update-profile error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
