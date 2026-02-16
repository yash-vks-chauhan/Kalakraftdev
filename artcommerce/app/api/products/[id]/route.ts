// File: app/api/products/[id]/route.ts
import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const raw = params.id
    if (!raw) {
      return NextResponse.json({ error: 'Missing product identifier' }, { status: 400 })
    }

    // Determine whether `raw` is a numeric ID or a slug
    let product
    if (/^[0-9]+$/.test(raw)) {
      // Numeric ID lookup
      product = await prisma.product.findUnique({
        where: { id: Number(raw) },
        include: { category: true },
      })
    } else {
      // Non-numeric → treat as slug lookup
      product = await prisma.product.findUnique({
        where: { slug: raw },
        include: { category: true },
      })
    }

    // Only serve active products
    if (product && !product.isActive) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (err: any) {
    // Log the full error for debugging
    console.error('GET /api/products/[id] error (full):', err)
    if (err?.code) {
      console.error('Prisma error code:', err.code)
    }
    return NextResponse.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    )
  }
}