// File: app/api/admin/products/[id]/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

function requireAdmin(req: Request) {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '') || ''
  try {
    return (jwt.verify(auth, JWT_SECRET) as any).role === 'admin'
  } catch {
    return false
  }
}

// GET, PATCH and DELETE all by numeric ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = Number(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true }
  })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  return NextResponse.json({ product })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = Number(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
  }

  const data = await request.json()
  
  // Only pick updatable fields including imageUrls
  const updateData: any = {}
  ;['name','slug','shortDesc','description','price','currency','stockQuantity','isActive','categoryId','imageUrls'].forEach(key => {
    if (data[key] !== undefined) updateData[key] = data[key]
  })

  // Ensure stockQuantity is never negative
  if (updateData.stockQuantity !== undefined && updateData.stockQuantity < 0) {
    updateData.stockQuantity = 0;
  }

  try {
    const updated = await prisma.product.update({
      where: { id },
      data: updateData
    })
    return NextResponse.json({ product: updated })
  } catch (err: any) {
    console.error('❌ update-product error:', err)
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = Number(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
  }

  try {
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('❌ delete-product error:', err)
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 })
  }
}
