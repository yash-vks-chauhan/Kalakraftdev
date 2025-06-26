import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import jwt from 'jsonwebtoken';
import prisma from '../../../../lib/prisma';

// Load service account credentials (should be JSON string in env)
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

console.log('Firebase Admin config loaded:', {
  projectIdPresent: !!serviceAccount.projectId,
  clientEmailPresent: !!serviceAccount.clientEmail,
  privateKeyPresent: !!serviceAccount.privateKey,
});

// Initialize Firebase Admin SDK once
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(serviceAccount as any),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
}

const adminAuth = getAuth();
const JWT_SECRET = process.env.JWT_SECRET!;

// Check if JWT_SECRET is available
if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set!');
}

export async function POST(req: NextRequest) {
  console.log('Firebase login endpoint called');
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      console.log('No ID token provided');
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    console.log('Verifying Firebase ID token...');
    // 1) Verify Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log('Firebase token verified for user:', decodedToken.email);

    // 2) Look up or create user in DB
    try {
      // Test database connection first
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection successful');
      
      let user = await prisma.user.findUnique({
        where: { email: decodedToken.email || '' },
      });

      if (!user) {
        console.log('Creating new user in database for:', decodedToken.email);
        try {
          user = await prisma.user.create({
            data: {
              id: uid,
              email: decodedToken.email!,
              fullName: decodedToken.name || decodedToken.email!,
              role: 'user',
              avatarUrl: decodedToken.picture || null,
            },
          });
          console.log('New user created:', user.id);
        } catch (createError) {
          console.error('Error creating user:', createError);
          return NextResponse.json({ 
            error: 'Failed to create user account', 
            details: createError.message 
          }, { status: 500 });
        }
      } else {
        console.log('Existing user found:', user.id);
      }

      // 3) Create our custom JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      console.log('JWT created successfully');

      // 4) Return response
      const res = NextResponse.json({ user, token }, { status: 200 });
      res.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      console.log('Login successful, returning response');

      return res;
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: dbError.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Firebase login error:', error);
    return NextResponse.json({ 
      error: 'Invalid ID token', 
      details: error.message || 'Unknown error' 
    }, { status: 401 });
  }
} 