// File: app/api/wishlist/[id]/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { isAllowedOrigin } from '../../../../lib/security'
import { getAuthenticatedUser } from '../../../../lib/session-auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const authUser = await getAuthenticatedUser(request)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const productId = Number(id)
  if (isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  // Find the wishlist item for this user and product
  const existing = await prisma.wishlistItem.findFirst({
    where: { userId: authUser.id, productId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.wishlistItem.delete({ where: { id: existing.id } })
  return NextResponse.json({ success: true })
}
