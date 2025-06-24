import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

const abandonedThreshold = new Date(Date.now() - 5 * 60 * 1000);

function getUserPayload(req: Request) {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '') || ''
  try {
    return jwt.verify(auth, JWT_SECRET) as { role: string }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const payload = getUserPayload(request)
  if (!payload?.role || payload.role !== 'admin') {
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
  const payload = getUserPayload(request)
  if (!payload?.role || payload.role !== 'admin') {
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