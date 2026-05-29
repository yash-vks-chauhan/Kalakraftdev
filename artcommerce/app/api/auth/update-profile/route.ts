import { NextResponse } from 'next/server'
import { getBoundedString, isSafeRelativeOrHttpsUrl } from '../../../../lib/inputValidation'
import prisma from '../../../../lib/prisma'
import { getAuthenticatedUser } from '../../../../lib/session-auth'

export const runtime = 'nodejs'

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const fullName = getBoundedString(body.fullName, 'fullName', 120, { required: true })
    if (!fullName.ok) {
      return NextResponse.json({ error: fullName.error }, { status: 400 })
    }

    const avatarUrl =
      typeof body.avatarUrl === 'string' && body.avatarUrl.trim()
        ? body.avatarUrl.trim()
        : undefined
    if (avatarUrl && (avatarUrl.length > 2048 || !isSafeRelativeOrHttpsUrl(avatarUrl))) {
      return NextResponse.json({ error: 'Invalid avatarUrl' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        fullName: fullName.value!,
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
