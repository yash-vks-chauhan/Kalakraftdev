import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getAuthenticatedUser } from '../../../../lib/session-auth'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatarUrl: true,
        defaultAddressId: true,
        defaultAddress: {
          select: {
            id: true,
            label: true,
            line1: true,
            line2: true,
            city: true,
            postalCode: true,
            country: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            subtotal: true,
            tax: true,
            shippingFee: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('GET /api/auth/me error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
