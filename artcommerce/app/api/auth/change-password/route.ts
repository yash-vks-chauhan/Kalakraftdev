import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number }

    const { oldPassword, newPassword } = await request.json()
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Fetch user
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
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
      where: { id: payload.userId },
      data: { passwordHash: newHash },
    })

    return NextResponse.json({ message: 'Password updated' })
  } catch (err: any) {
    console.error('Change password error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
