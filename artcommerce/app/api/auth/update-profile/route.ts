// File: app/api/auth/update-profile/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getAuthFromRequest } from '../../../../lib/auth'

// Ensure this API runs in Node.js runtime
export const runtime = 'nodejs'
const JWT_SECRET = process.env.JWT_SECRET!

export async function PATCH(request: Request) {
  try {
    // 1️⃣ Verify from cookie or Authorization header
    const auth = getAuthFromRequest(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 3️⃣ Parse and validate request body
    const { fullName, avatarUrl } = await request.json()
    if (!fullName || typeof fullName !== 'string') {
      return NextResponse.json({ error: 'fullName is required' }, { status: 400 })
    }

    // 4️⃣ Update the user in the database
    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        fullName: fullName.trim(),
        avatarUrl: typeof avatarUrl === 'string' ? avatarUrl.trim() : undefined,
      },
      select: { id: true, fullName: true, email: true, avatarUrl: true },
    })

    // 5️⃣ Return the updated user profile
    return NextResponse.json({ user: updatedUser })
  } catch (err: any) {
    console.error('PATCH /api/auth/update-profile error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
