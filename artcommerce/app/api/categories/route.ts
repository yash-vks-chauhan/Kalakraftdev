// app/api/categories/route.ts
import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
  return NextResponse.json({ categories })
}