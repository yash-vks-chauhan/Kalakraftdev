// File: app/api/addresses/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

/** Helper to extract userId from Bearer token */
function getUserId(request: Request): number | null {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null
  try {
    return (jwt.verify(token, JWT_SECRET) as any).userId
  } catch {
    return null
  }
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