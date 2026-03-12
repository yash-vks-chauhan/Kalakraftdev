import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { isAllowedOrigin } from '../../../../lib/security'
import { requireAdminUser } from '../../../../lib/session-auth'

const abandonedThreshold = new Date(Date.now() - 5 * 60 * 1000);

export async function GET(request: Request) {
  const admin = await requireAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // return all users with their abandoned cart count
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          cartItems: {
            where: {
              addedAt: { lt: abandonedThreshold }
            }
          }
        }
      }
    }
  })

  // Transform the response to include abandonedCartCount
  const usersWithCounts = users.map(user => ({
    ...user,
    abandonedCartCount: user._count.cartItems,
    _count: undefined
  }))

  return NextResponse.json({ users: usersWithCounts })
}

export async function PATCH(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = await requireAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, role } = await request.json()
  if (!userId || !['user','admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, fullName: true, email: true, role: true }
  })

  return NextResponse.json({ user: updated })
}
