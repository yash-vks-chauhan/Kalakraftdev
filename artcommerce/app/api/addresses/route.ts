// File: app/api/addresses/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { getAuthFromRequest } from '../../../lib/auth'

const JWT_SECRET = process.env.JWT_SECRET!

/** Helper to extract userId from cookie or Authorization header */
function getUserId(request: Request): number | null {
  const auth = getAuthFromRequest(request)
  return auth ? auth.userId : null
}

// GET /api/addresses → list all addresses for the current user
export async function GET(request: Request) {
  const userId = getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ addresses })
}

// POST /api/addresses → create a new address for the current user
export async function POST(request: Request) {
  const userId = getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const { label, line1, line2, city, postalCode, country } = body

  // Basic validation
  if (!label || !line1 || !city || !postalCode || !country) {
    return NextResponse.json(
      { error: 'Missing required address fields' },
      { status: 400 }
    )
  }

  const address = await prisma.address.create({
    data: {
      userId,
      label,
      line1,
      line2: line2 || null,
      city,
      postalCode,
      country,
    },
  })

  return NextResponse.json({ address }, { status: 201 })
}
