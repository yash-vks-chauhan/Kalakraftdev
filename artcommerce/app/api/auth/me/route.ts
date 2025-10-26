// File: app/api/auth/me/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'
const JWT_SECRET = process.env.JWT_SECRET!

export async function GET(request: Request) {
  console.log('GET /api/auth/me: Request received')
  try {
    // 1️⃣ Extract token from Authorization header or cookie (httpOnly)
    const authHeader = request.headers.get('authorization') || ''
    let token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''
    if (!token) {
      const cookie = request.headers.get('cookie') || ''
      const match = cookie.match(/(?:^|;\s*)token=([^;]+)/)
      if (match) token = decodeURIComponent(match[1])
    }
    if (!token) {
      console.log('GET /api/auth/me: No token in header or cookie')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('GET /api/auth/me: Token extracted')

    // 2️⃣ Verify JWT
    let payload: { userId: number }
    try {
      console.log('GET /api/auth/me: Verifying JWT with secret:', JWT_SECRET ? 'Present' : 'Missing')
      payload = jwt.verify(token, JWT_SECRET) as { userId: number }
      console.log('GET /api/auth/me: JWT verified, payload:', payload)
    } catch (err) {
      console.error('GET /api/auth/me: JWT verification failed:', err)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 3️⃣ Fetch user + orders
    console.log('GET /api/auth/me: Fetching user from database, userId:', payload.userId)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatarUrl: true,
        defaultAddressId: true,
        defaultAddress: {
          select: { 
            id: true, 
            label: true, 
            line1: true, 
            line2: true,
            city: true, 
            postalCode: true, 
            country: true 
          }
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            subtotal: true,
            tax: true,
            shippingFee: true,
            totalAmount: true,
            status: true,
          }
        }
      }
    })
    console.log('GET /api/auth/me: Database query result:', user ? 'User found' : 'User not found')
    
    if (!user) {
      console.log('GET /api/auth/me: User not found in database')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 4️⃣ Return full profile
    console.log('GET /api/auth/me: Returning user profile')
    return NextResponse.json({ user })
  } catch (err: any) {
    console.error('GET /api/auth/me error:', err)
    console.error('Error stack:', err.stack)
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 })
  }
}
