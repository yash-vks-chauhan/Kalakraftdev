// File: app/api/wishlist/[id]/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const productId = Number(params.id)
  if (isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  // Find the wishlist item for this user and product
  const existing = await prisma.wishlistItem.findFirst({
    where: { userId, productId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.wishlistItem.delete({ where: { id: existing.id } })
  return NextResponse.json({ success: true })
}