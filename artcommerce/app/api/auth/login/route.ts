// File: app/api/auth/login/route.ts

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET! // ensure this is set in your .env

export async function POST(request: Request) {
  console.log('Login API: Request received');
  try {
    // Parse request body
    let email, password;
    try {
      const body = await request.json();
      email = body.email;
      password = body.password;
      console.log('Login API: Request body parsed', { hasEmail: !!email, hasPassword: !!password });
    } catch (err) {
      console.error('Login API: Invalid request body', err);
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    // Validate required fields
    if (!email && !password) {
      console.log('Login API: Missing both fields');
      return NextResponse.json({ error: 'Please enter both email and password' }, { status: 400 });
    }
    if (!email) {
      console.log('Login API: Missing email');
      return NextResponse.json({ error: 'Please enter your email' }, { status: 400 });
    }
    if (!password) {
      console.log('Login API: Missing password');
      return NextResponse.json({ error: 'Please enter your password' }, { status: 400 });
    }

    console.log('Login API: Looking up user');
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
      console.log('Login API: User not found');
      return NextResponse.json({ error: 'The email or password you entered is incorrect' }, { status: 401 });
    }

    // Check password hash exists
    if (!user.passwordHash || typeof user.passwordHash !== 'string') {
      console.log('Login API: Invalid password hash');
      return NextResponse.json({ error: 'Account not properly configured. Please reset your password.' }, { status: 401 });
    }

    // Verify password
    let isValid = false;
    try {
      console.log('Login API: Verifying password');
      isValid = await bcrypt.compare(password, user.passwordHash);
    } catch (err) {
      console.error('Login API: Password comparison error', err);
      return NextResponse.json({ error: 'Authentication error occurred' }, { status: 401 });
    }

    if (!isValid) {
      console.log('Login API: Invalid password');
      return NextResponse.json({ error: 'The email or password you entered is incorrect' }, { status: 401 });
    }

    console.log('Login API: Generating JWT');
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Login API: Creating response');
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

    console.log('Login API: Setting cookie');
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

    console.log('Login API: Returning successful response');
    return response;
  } catch (err) {
    console.error('Login API: Unexpected error', err);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}