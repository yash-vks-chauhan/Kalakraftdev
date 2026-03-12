import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { isAllowedOrigin } from '../../../../lib/security'
import { getAuthenticatedUser } from '../../../../lib/session-auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const authUser = await getAuthenticatedUser(req)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const addressId = Number(body.addressId)
  if (!Number.isInteger(addressId) || addressId <= 0) {
    return NextResponse.json({ error: 'Missing addressId' }, { status: 400 })
  }

  const addr = await prisma.address.findFirst({
    where: { id: addressId, userId: authUser.id },
  })
  if (!addr) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }

  await prisma.user.update({
    where: { id: authUser.id },
    data: { defaultAddressId: addressId },
  })

  return NextResponse.json({ ok: true })
}
