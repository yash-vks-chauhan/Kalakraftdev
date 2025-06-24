import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'
const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let userId: number
  try { userId = (jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any).userId }
  catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }) }

  const { addressId } = await req.json()
  if (typeof addressId !== 'number') {
    return NextResponse.json({ error: 'Missing addressId' }, { status: 400 })
  }

  // sanity check: ensure this address belongs to them
  const addr = await prisma.address.findFirst({ where: { id: addressId, userId } })
  if (!addr) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }

  // set it
  await prisma.user.update({
    where: { id: userId },
    data: { defaultAddressId: addressId },
  })

  return NextResponse.json({ ok: true })
}