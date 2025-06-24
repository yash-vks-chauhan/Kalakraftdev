// File: app/api/auth/signup/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(request: Request) {
  try {
    const { fullName, email, password } = await request.json()

    // 1️⃣ Check if already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    // 2️⃣ Hash & create (role defaults to "user")
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { fullName, email, passwordHash, role: 'user' },
      select: { id: true, fullName: true, email: true, avatarUrl: true, role: true }
    })

    // 3️⃣ Sign a JWT including role
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 4️⃣ Build the response
    const response = NextResponse.json({ user, token })

    // 5️⃣ Set the JWT as an HTTP-only cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (err) {
    console.error('POST /api/auth/signup error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}