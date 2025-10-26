import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getAuthFromRequest } from '../../../../lib/auth'

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(request: Request) {
  try {
    const auth = getAuthFromRequest(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { oldPassword, newPassword } = await request.json()
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Fetch user
    const user = await prisma.user.findUnique({ where: { id: auth.userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify old password
    const valid = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 403 })
    }

    // Hash new password and update
    const newHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: auth.userId },
      data: { passwordHash: newHash },
    })

    return NextResponse.json({ message: 'Password updated' })
  } catch (err: any) {
    console.error('Change password error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
