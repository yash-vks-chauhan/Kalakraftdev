// File: app/api/orders/[id]/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

function getUserPayload(request: Request): { userId: number; role: string } | null {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string }
  } catch {
    return null
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const payload = getUserPayload(request)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = Number(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
  }

  // admin can see any order, normal users only their own
  const whereClause = payload.role === 'admin'
    ? { id }
    : { id, userId: payload.userId }

    const order = await prisma.order.findUnique({
      where: { id: Number(params.id) },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        subtotal: true,
        tax: true,
        shippingFee: true,
        totalAmount: true,
        couponCode: true,
        discountAmount: true,
        discountedTotal: true,
        createdAt: true,
        shippingAddress: true,
        billingAddress: true,
        paymentMethod: true,
        paymentStatus: true,
        user: {
          select: { 
            id: true,
            fullName: true, 
            email: true,
            addresses: {
              select: {
                id: true,
                label: true,
                line1: true,
                line2: true,
                city: true,
                postalCode: true,
                country: true
              }
            }
          }
        },
        orderItems: {
          select: {
            id: true,
            quantity: true,
            priceAtPurchase: true,
            product: {
              select: { 
                id: true, 
                name: true, 
                currency: true, 
                imageUrls: true 
              }
            }
          }
        },
        orderNotes: {
          select: {
            id: true,
            text: true,            // whatever your note field is called
            createdAt: true,
            author: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      }
    })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({ order })
}