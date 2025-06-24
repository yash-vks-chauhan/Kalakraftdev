// File: app/api/wishlist/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

// Helper to extract userId from Bearer token
function getUserId(request: Request): number | null {
  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return null
  try {
    const payload: any = jwt.verify(token, JWT_SECRET)
    return payload.userId
  } catch {
    return null
  }
}

//
// GET /api/wishlist → list all wishlist items for current user
//
export async function GET(request: Request) {
  const userId = getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: true, // include product details
    },
  })

  return NextResponse.json({ wishlistItems: items })
}

//
// POST /api/wishlist → add a new product to the current user’s wishlist
//
export async function POST(request: Request) {
  const userId = getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { productId } = await request.json()
  if (typeof productId !== 'number') {
    return NextResponse.json({ error: 'Invalid productId' }, { status: 400 })
  }

  // (Optional) check if this product is already in the wishlist:
  const existing = await prisma.wishlistItem.findFirst({
    where: { userId, productId },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'Already in wishlist' },
      { status: 400 }
    )
  }

  // Create new wishlist entry
  const newItem = await prisma.wishlistItem.create({
    data: {
      user: { connect: { id: userId } },
      product: { connect: { id: productId } },
    },
    include: {
      product: true, // so the client gets product details
    },
  })

  return NextResponse.json({ wishlistItem: newItem })
}