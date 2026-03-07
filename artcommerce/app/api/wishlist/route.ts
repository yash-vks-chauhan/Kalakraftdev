// File: app/api/wishlist/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { getAuthenticatedUser } from '../../../lib/session-auth'

//
// GET /api/wishlist → list all wishlist items for current user
//
export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: authUser.id },
    include: {
      product: {
        include: {
          category: true, // Include category details
        },
      },
    },
  })

  return NextResponse.json({ wishlistItems: items })
}

//
// POST /api/wishlist → add a new product to the current user’s wishlist
//
export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { productId } = await request.json()
  if (typeof productId !== 'number') {
    return NextResponse.json({ error: 'Invalid productId' }, { status: 400 })
  }

  // (Optional) check if this product is already in the wishlist:
  const existing = await prisma.wishlistItem.findFirst({
    where: { userId: authUser.id, productId },
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
      user: { connect: { id: authUser.id } },
      product: { connect: { id: productId } },
    },
    include: {
      product: {
        include: {
          category: true, // Include category details
        },
      },
    },
  })

  return NextResponse.json({ wishlistItem: newItem })
}
