import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

function getUserPayload(req: Request) {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '') || ''
  try {
    return jwt.verify(auth, JWT_SECRET) as { userId: number; role: string }
  } catch {
    return null
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const payload = getUserPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orderId = Number(params.id)
  const notes = await prisma.orderNote.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { fullName: true } }
    }
  })
  return NextResponse.json({ notes })
}

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
  ) {
    const payload = getUserPayload(req)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
    const orderId = Number(params.id)
    const { text } = await req.json()
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Empty note' }, { status: 400 })
    }
  
    const note = await prisma.orderNote.create({
      data: {
        orderId,
        authorId: payload.userId,
        text: text.trim(),
      },
      include: { author: { select: { fullName: true } } }
    })
    return NextResponse.json({ note }, { status: 201 })
  }