import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getAuthFromRequest } from '../../../../lib/auth'

export const runtime = 'nodejs'
const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(req: Request) {
  const auth = getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = auth.userId

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
