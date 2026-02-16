// File: app/api/addresses/[id]/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

function getUserId(request: Request): string | null {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId?: string | number }
    if (payload.userId === undefined || payload.userId === null) {
      return null
    }
    return String(payload.userId)
  } catch {
    return null
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await params
  const id = Number(rawId)
  const address = await prisma.address.findFirst({
    where: { id, userId },
  })
  if (!address) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ address })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await params
  const id = Number(rawId)
  const body = await request.json()
  const { label, line1, line2, city, postalCode, country } = body

  const existing = await prisma.address.findFirst({
    where: { id, userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.address.update({
    where: { id },
    data: {
      ...(label !== undefined ? { label } : {}),
      ...(line1 !== undefined ? { line1 } : {}),
      ...(line2 !== undefined ? { line2 } : {}),
      ...(city !== undefined ? { city } : {}),
      ...(postalCode !== undefined ? { postalCode } : {}),
      ...(country !== undefined ? { country } : {}),
    },
  })

  return NextResponse.json({ address: updated })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await params
  const id = Number(rawId)
  // Ensure it belongs to the user
  const existing = await prisma.address.findFirst({
    where: { id, userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await prisma.address.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
