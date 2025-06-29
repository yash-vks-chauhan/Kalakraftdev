import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';
import { sign } from 'jsonwebtoken';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

    initializeApp({
      credential: cert(serviceAccount as any),
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

const adminAuth = getAuth();
const JWT_SECRET = process.env.JWT_SECRET!;

// Check if JWT_SECRET is available
if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set!');
}

export async function POST(request: Request) {
  console.log('POST /api/auth/firebase-login: Starting Firebase login process');
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      console.log('POST /api/auth/firebase-login: No token provided');
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 400 }
      );
    }

    console.log('POST /api/auth/firebase-login: Verifying Firebase token');
    const decodedToken = await auth.verifyIdToken(token);
    const { email, uid, name } = decodedToken;

    console.log('POST /api/auth/firebase-login: Looking up or creating user');
    // Find or create user in your database
    let user = await prisma.user.findUnique({
      where: { email: email?.toLowerCase() },
    });

    if (!user && email) {
      console.log('POST /api/auth/firebase-login: Creating new user');
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          firebaseUid: uid,
          name: name || email.split('@')[0],
          role: 'USER',
        },
      });
    } else if (user && !user.firebaseUid) {
      console.log('POST /api/auth/firebase-login: Linking existing user with Firebase');
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid: uid },
      });
    }

    if (!user) {
      console.error('POST /api/auth/firebase-login: Failed to create/update user');
      return NextResponse.json(
        { message: 'Failed to create user' },
        { status: 500 }
      );
    }

    console.log('POST /api/auth/firebase-login: Creating session token');
    // Create session token
    const sessionToken = sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    // Create response
    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Set cookie
    console.log('POST /api/auth/firebase-login: Setting auth cookie');
    response.cookies.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.log('POST /api/auth/firebase-login: Login successful');
    return response;
  } catch (error: any) {
    console.error('POST /api/auth/firebase-login: Error during login:', error);
    return NextResponse.json(
      { message: error.message || 'Authentication failed' },
      { status: 401 }
    );
  }
} 