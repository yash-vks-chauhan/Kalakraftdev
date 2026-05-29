// File: app/api/cart/[id]/route.ts
import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { parsePositiveInteger } from '../../../../lib/inputValidation'
import { getAuthenticatedUser } from '../../../../lib/session-auth'

const MAX_CART_QUANTITY = 99

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
  const cartItemIdResult = parsePositiveInteger(id, 'cartItemId')
  if (!cartItemIdResult.ok) return NextResponse.json({ error: cartItemIdResult.error }, { status: 400 })
  const cartItemId = cartItemIdResult.value

  // Parse request body
  let requestData: any;
  try {
    requestData = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const quantityResult = parsePositiveInteger(requestData.quantity, 'quantity', { max: MAX_CART_QUANTITY })
  if (!quantityResult.ok) return NextResponse.json({ error: quantityResult.error }, { status: 400 })
  const quantity = quantityResult.value

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
  if (!existing.product.isActive) {
    return NextResponse.json({ error: 'Product is no longer available' }, { status: 400 })
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
  const cartItemIdResult = parsePositiveInteger(id, 'cartItemId')
  if (!cartItemIdResult.ok) return NextResponse.json({ error: cartItemIdResult.error }, { status: 400 })
  const cartItemId = cartItemIdResult.value

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
