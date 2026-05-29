// File: app/api/addresses/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { getBoundedString } from '../../../lib/inputValidation'
import { getAuthenticatedUser } from '../../../lib/session-auth'

const ADDRESS_LIMITS = {
  label: 40,
  line1: 160,
  line2: 160,
  city: 80,
  postalCode: 24,
  country: 80,
}

// GET /api/addresses → list all addresses for the current user
export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const addresses = await prisma.address.findMany({
    where: { userId: authUser.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ addresses })
}

// POST /api/addresses → create a new address for the current user
export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const label = getBoundedString(body.label, 'label', ADDRESS_LIMITS.label, { required: true })
  const line1 = getBoundedString(body.line1, 'line1', ADDRESS_LIMITS.line1, { required: true })
  const line2 = getBoundedString(body.line2, 'line2', ADDRESS_LIMITS.line2)
  const city = getBoundedString(body.city, 'city', ADDRESS_LIMITS.city, { required: true })
  const postalCode = getBoundedString(body.postalCode, 'postalCode', ADDRESS_LIMITS.postalCode, { required: true })
  const country = getBoundedString(body.country, 'country', ADDRESS_LIMITS.country, { required: true })

  for (const result of [label, line1, line2, city, postalCode, country]) {
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  }

  const address = await prisma.address.create({
    data: {
      userId: authUser.id,
      label: label.value!,
      line1: line1.value!,
      line2: line2.value,
      city: city.value!,
      postalCode: postalCode.value!,
      country: country.value!,
    },
  })

  return NextResponse.json({ address }, { status: 201 })
}
