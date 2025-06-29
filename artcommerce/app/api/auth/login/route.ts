// File: app/api/auth/login/route.ts

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  console.log('POST /api/auth/login: Starting login process')
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('POST /api/auth/login: Validating input', { hasEmail: !!email, hasPassword: !!password })
    if (!email || !password) {
      console.log('POST /api/auth/login: Missing credentials')
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('POST /api/auth/login: Looking up user')
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
      },
    })

    if (!user || !user.password) {
      console.log('POST /api/auth/login: User not found or no password set')
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    console.log('POST /api/auth/login: Verifying password')
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      console.log('POST /api/auth/login: Invalid password')
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    console.log('POST /api/auth/login: Creating session token')
    // Create session token
    const token = sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    )

    // Create response with user data (excluding password)
    const { password: _, ...userWithoutPassword } = user
    console.log('POST /api/auth/login: Preparing response with user data')

    // Create response
    const response = NextResponse.json(userWithoutPassword)

    // Set cookie
    console.log('POST /api/auth/login: Setting auth cookie')
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    console.log('POST /api/auth/login: Login successful')
    return response

  } catch (error) {
    console.error('POST /api/auth/login: Error during login:', error)
    return NextResponse.json(
      { message: 'An error occurred during login. Please try again.' },
      { status: 500 }
    )
  }
}