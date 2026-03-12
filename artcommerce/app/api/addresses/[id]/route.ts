// File: app/api/addresses/[id]/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getAuthenticatedUser } from '../../../../lib/session-auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await params
  const id = Number(rawId)
  const address = await prisma.address.findFirst({
    where: { id, userId: authUser.id },
  })
  if (!address) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ address })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await params
  const id = Number(rawId)
  const body = await request.json()
  const { label, line1, line2, city, postalCode, country } = body

  const existing = await prisma.address.findFirst({
    where: { id, userId: authUser.id },
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
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await params
  const id = Number(rawId)
  // Ensure it belongs to the user
  const existing = await prisma.address.findFirst({
    where: { id, userId: authUser.id },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await prisma.address.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
