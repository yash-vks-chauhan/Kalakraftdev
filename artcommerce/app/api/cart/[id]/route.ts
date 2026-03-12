// File: app/api/cart/[id]/route.ts
import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getAuthenticatedUser } from '../../../../lib/session-auth'

// PUT /api/cart/[id] (id is cartItemId)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const cartItemId = parseInt(id, 10)
  if (isNaN(cartItemId)) {
    return NextResponse.json({ error: 'Invalid cart item ID' }, { status: 400 })
  }

  // Parse request body
  let requestData;
  try {
    requestData = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { quantity } = requestData;
  if (typeof quantity !== 'number' || quantity < 1) {
    return NextResponse.json({ error: 'Quantity must be a positive number' }, { status: 400 })
  }

  // Verify that this cartItem belongs to the user before updating
  const existing = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      product: true
    }
  })
  
  if (!existing || existing.userId !== authUser.id) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }
  
  // Check if the requested quantity exceeds available stock
  if (quantity > existing.product.stockQuantity) {
    return NextResponse.json({ 
      error: `Cannot update quantity. Only ${existing.product.stockQuantity} items available in stock`,
      availableStock: existing.product.stockQuantity
    }, { status: 400 })
  }

  // Update it
  const updatedCartItem = await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          imageUrls: true,
          stockQuantity: true
        }
      }
    }
  })

  return NextResponse.json({ cartItem: updatedCartItem })
}

// DELETE /api/cart/[id]? (id is cartItemId)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const cartItemId = parseInt(id, 10)

  if (isNaN(cartItemId)) {
    return NextResponse.json({ error: 'Invalid cart item ID' }, { status: 400 })
  }

  // Verify that this cartItem belongs to the user before deleting
  const existing = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
  })
  if (!existing || existing.userId !== authUser.id) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  // Delete it
  await prisma.cartItem.delete({ where: { id: cartItemId } })
  return NextResponse.json({ success: true })
}
