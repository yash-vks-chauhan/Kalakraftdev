// app/api/categories/route.ts
import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

/** imageUrls is a Json column, so it arrives as an array or a JSON string. */
function firstImage(value: unknown): string | null {
  let list: unknown = value
  if (typeof value === 'string') {
    try {
      list = JSON.parse(value)
    } catch {
      return null
    }
  }
  if (!Array.isArray(list)) return null
  for (const entry of list) {
    if (typeof entry === 'string' && entry.trim()) return entry
    if (entry && typeof entry === 'object' && typeof (entry as any).url === 'string') {
      return (entry as any).url
    }
  }
  return null
}

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      // Category has no image column, so thumbnails used to come from eight
      // stills matched by name. Those live in public/images, which is tracked
      // with Git LFS — a deploy that doesn't fetch LFS objects serves the
      // pointer file instead of a PNG, and every thumbnail silently breaks.
      // Borrowing the newest product in the category can't go missing the
      // same way, and it shows what's actually in there.
      products: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { imageUrls: true },
      },
    },
  })

  return NextResponse.json({
    categories: categories.map(({ products, ...category }) => ({
      ...category,
      image: products.map((p) => firstImage(p.imageUrls)).find(Boolean) ?? null,
    })),
  })
}
