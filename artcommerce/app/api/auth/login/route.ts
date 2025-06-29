// File: app/api/auth/login/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET! // ensure this is set in your .env

export async function POST(request: Request) {
  try {
    // Parse request body
    let email, password;
    try {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } catch (err) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    // Validate required fields
    if (!email && !password) {
      return NextResponse.json({ error: 'Please enter both email and password' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: 'Please enter your email' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: 'Please enter your password' }, { status: 400 });
    }

    // Look up the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        role: true,
        passwordHash: true,
      },
    });

    // User not found - but we don't want to reveal this information
    if (!user) {
      return NextResponse.json({ error: 'The email or password you entered is incorrect' }, { status: 401 });
    }

    // Check password hash exists
    if (!user.passwordHash || typeof user.passwordHash !== 'string') {
      return NextResponse.json({ error: 'Account not properly configured. Please reset your password.' }, { status: 401 });
    }

    // Verify password
    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, user.passwordHash);
    } catch (err) {
      console.error('Password comparison error:', err);
      return NextResponse.json({ error: 'Authentication error occurred' }, { status: 401 });
    }

    if (!isValid) {
      return NextResponse.json({ error: 'The email or password you entered is incorrect' }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create response
    const response = NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      token,
    });

    // Set cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}