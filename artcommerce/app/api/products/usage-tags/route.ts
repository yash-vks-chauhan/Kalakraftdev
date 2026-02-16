import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'

export async function GET() {
  // Fetch usageTags arrays from all active products, flatten and deduplicate
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: { usageTags: true } as any,
  })

  const tagSet = new Set<string>()
  for (const row of rows) {
    const tags: unknown = (row as any).usageTags
    if (Array.isArray(tags)) {
      for (const t of tags) {
        if (typeof t === 'string' && t.trim()) {
          tagSet.add(t.trim())
        }
      }
    }
  }

  return NextResponse.json({ tags: Array.from(tagSet).sort() })
} 