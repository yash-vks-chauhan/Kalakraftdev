import { NextResponse } from 'next/server'
import { getBoundedString } from '../../../../lib/inputValidation'
import prisma from '../../../../lib/prisma'
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
  const admin = await requireAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const userIdResult = getBoundedString(body.userId, 'userId', 128, { required: true })
  if (!userIdResult.ok) {
    return NextResponse.json({ error: userIdResult.error }, { status: 400 })
  }
  const userId = userIdResult.value!
  const role = body.role
  if (!['user','admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  if (userId === admin.id && role !== admin.role) {
    return NextResponse.json({ error: 'Admins cannot change their own role' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (target.role === 'admin' && role !== 'admin') {
    const adminCount = await prisma.user.count({ where: { role: 'admin' } })
    if (adminCount <= 1) {
      return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 })
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, fullName: true, email: true, role: true }
  })

  return NextResponse.json({ user: updated })
}
