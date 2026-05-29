// File: app/api/addresses/[id]/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getBoundedString, parsePositiveInteger } from '../../../../lib/inputValidation'
import { getAuthenticatedUser } from '../../../../lib/session-auth'

const ADDRESS_LIMITS = {
  label: 40,
  line1: 160,
  line2: 160,
  city: 80,
  postalCode: 24,
  country: 80,
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await params
  const idResult = parsePositiveInteger(rawId, 'addressId')
  if (!idResult.ok) return NextResponse.json({ error: idResult.error }, { status: 400 })
  const id = idResult.value
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
  const idResult = parsePositiveInteger(rawId, 'addressId')
  if (!idResult.ok) return NextResponse.json({ error: idResult.error }, { status: 400 })
  const id = idResult.value
  const body = await request.json().catch(() => ({}))

  const existing = await prisma.address.findFirst({
    where: { id, userId: authUser.id },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const data: Record<string, string | null> = {}
  const fields = [
    ['label', ADDRESS_LIMITS.label],
    ['line1', ADDRESS_LIMITS.line1],
    ['line2', ADDRESS_LIMITS.line2],
    ['city', ADDRESS_LIMITS.city],
    ['postalCode', ADDRESS_LIMITS.postalCode],
    ['country', ADDRESS_LIMITS.country],
  ] as const

  for (const [field, maxLength] of fields) {
    if (body[field] === undefined) continue
    const result = getBoundedString(body[field], field, maxLength, { required: field !== 'line2' })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    data[field] = result.value
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No address fields provided' }, { status: 400 })
  }

  const updated = await prisma.address.update({
    where: { id },
    data,
  })

  return NextResponse.json({ address: updated })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await params
  const idResult = parsePositiveInteger(rawId, 'addressId')
  if (!idResult.ok) return NextResponse.json({ error: idResult.error }, { status: 400 })
  const id = idResult.value
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
