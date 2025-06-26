// File: app/api/cart/route.ts
import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

function getUserId(request: Request): string | null {
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

export async function GET(request: Request) {
  const userId = getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch that user's cart items
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
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
  const userId = getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { productId, quantity } = await request.json()
  if (!productId || !quantity) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // First, check if the product exists and is in stock
  const product = await prisma.product.findUnique({
    where: { id: productId }
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
    where: { userId, productId },
  })

  let cartItem
  if (existing) {
    // Check if the combined quantity exceeds available stock
    if (existing.quantity + quantity > product.stockQuantity) {
      return NextResponse.json({ 
        error: `Cannot add ${quantity} more items. Only ${product.stockQuantity} items available in stock` 
      }, { status: 400 })
    }

    // Update quantity
    cartItem = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
      include: { product: true },
    })
  } else {
    // Insert a brand‐new cartItem
    cartItem = await prisma.cartItem.create({
      data: { userId, productId, quantity },
      include: { product: true },
    })
  }

  return NextResponse.json({ cartItem })
}

export async function PUT(request: Request) {
  const userId = getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // We expect the URL to be /api/cart/:cartItemId
  const url = new URL(request.url)
  const cartItemIdStr = url.pathname.split('/').pop()!
  const cartItemId = Number(cartItemIdStr)

  const { quantity } = await request.json()
  if (quantity < 1) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
  }

  // Make sure the cartItem belongs to this user
  const existing = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
  })
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
    include: { product: true },
  })

  return NextResponse.json({ cartItem: updated })
}

export async function DELETE(request: Request) {
  const userId = getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // URL: /api/cart/:cartItemId
  const url = new URL(request.url)
  const cartItemIdStr = url.pathname.split('/').pop()!
  const cartItemId = Number(cartItemIdStr)

  // Make sure it belongs to this user
  const existing = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
  })
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.cartItem.delete({ where: { id: cartItemId } })
  return NextResponse.json({ success: true })
}