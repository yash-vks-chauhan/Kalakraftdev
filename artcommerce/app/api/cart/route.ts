// File: app/api/cart/route.ts
import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { parsePositiveInteger } from '../../../lib/inputValidation'
import { getAuthenticatedUser } from '../../../lib/session-auth'

const MAX_CART_QUANTITY = 99

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch that user's cart items
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: authUser.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          imageUrls: true,
        },
      },
    },
  })

  return NextResponse.json({ cartItems })
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const productIdResult = parsePositiveInteger(body.productId, 'productId')
  if (!productIdResult.ok) return NextResponse.json({ error: productIdResult.error }, { status: 400 })

  const quantityResult = parsePositiveInteger(body.quantity, 'quantity', { max: MAX_CART_QUANTITY })
  if (!quantityResult.ok) return NextResponse.json({ error: quantityResult.error }, { status: 400 })

  const productId = productIdResult.value
  const quantity = quantityResult.value

  // First, check if the product exists and is in stock
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true }
  });

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  if (product.stockQuantity <= 0) {
    return NextResponse.json({ error: 'Product is out of stock' }, { status: 400 })
  }

  // Check if the requested quantity is available
  if (product.stockQuantity < quantity) {
    return NextResponse.json({ 
      error: `Only ${product.stockQuantity} items available in stock` 
    }, { status: 400 })
  }

  // Check if an item already exists in the cart
  const existing = await prisma.cartItem.findFirst({
    where: { userId: authUser.id, productId },
  })

  let cartItem
  if (existing) {
    const existingQuantity =
      Number.isSafeInteger(existing.quantity) && existing.quantity > 0 ? existing.quantity : 0
    const nextQuantity = existingQuantity + quantity

    if (nextQuantity > MAX_CART_QUANTITY) {
      return NextResponse.json(
        { error: `Cart quantity cannot exceed ${MAX_CART_QUANTITY}` },
        { status: 400 }
      )
    }

    // Check if the combined quantity exceeds available stock
    if (nextQuantity > product.stockQuantity) {
      return NextResponse.json({ 
        error: `Cannot add ${quantity} more items. Only ${product.stockQuantity} items available in stock` 
      }, { status: 400 })
    }

    // Update quantity
    cartItem = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQuantity },
      include: { product: true },
    })
  } else {
    // Insert a brand‐new cartItem
    cartItem = await prisma.cartItem.create({
      data: { userId: authUser.id, productId, quantity },
      include: { product: true },
    })
  }

  return NextResponse.json({ cartItem })
}

export async function PUT(request: Request) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // We expect the URL to be /api/cart/:cartItemId
  const url = new URL(request.url)
  const cartItemIdStr = url.pathname.split('/').pop()!
  const cartItemIdResult = parsePositiveInteger(cartItemIdStr, 'cartItemId')
  if (!cartItemIdResult.ok) {
    return NextResponse.json({ error: cartItemIdResult.error }, { status: 400 })
  }
  const cartItemId = cartItemIdResult.value

  const body = await request.json().catch(() => ({}))
  const quantityResult = parsePositiveInteger(body.quantity, 'quantity', { max: MAX_CART_QUANTITY })
  if (!quantityResult.ok) return NextResponse.json({ error: quantityResult.error }, { status: 400 })
  const quantity = quantityResult.value

  // Make sure the cartItem belongs to this user
  const existing = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { product: true },
  })
  if (!existing || existing.userId !== authUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!existing.product.isActive || quantity > existing.product.stockQuantity) {
    return NextResponse.json(
      {
        error: `Cannot update quantity. Only ${Math.max(0, existing.product.stockQuantity)} items available in stock`,
        availableStock: Math.max(0, existing.product.stockQuantity),
      },
      { status: 400 }
    )
  }

  const updated = await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
    include: { product: true },
  })

  return NextResponse.json({ cartItem: updated })
}

export async function DELETE(request: Request) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // URL: /api/cart/:cartItemId
  const url = new URL(request.url)
  const cartItemIdStr = url.pathname.split('/').pop()!
  const cartItemIdResult = parsePositiveInteger(cartItemIdStr, 'cartItemId')
  if (!cartItemIdResult.ok) {
    return NextResponse.json({ error: cartItemIdResult.error }, { status: 400 })
  }
  const cartItemId = cartItemIdResult.value

  // Make sure it belongs to this user
  const existing = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
  })
  if (!existing || existing.userId !== authUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.cartItem.delete({ where: { id: cartItemId } })
  return NextResponse.json({ success: true })
}
