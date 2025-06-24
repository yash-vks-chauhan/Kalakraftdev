import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import prisma from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing ID token' },
        { status: 400 }
      );
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email: decodedToken.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: decodedToken.email!,
          fullName: decodedToken.name || decodedToken.email!,
          role: 'user',
          avatarUrl: decodedToken.picture || null
        }
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create the response with user data and token
    const response = NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl
      },
      token 
    });

    // Set the token as an HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Firebase login error:', error);
    return NextResponse.json(
      { error: 'Invalid ID token' },
      { status: 401 }
    );
  }
} 