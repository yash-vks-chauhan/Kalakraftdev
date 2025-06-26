// app/api/products/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

export async function GET() {
  const products = await prisma.product.findMany({ where: { isActive: true } })
  return NextResponse.json({ products })
}

export async function POST(req: Request) {
  // ... (optional create logic)
}