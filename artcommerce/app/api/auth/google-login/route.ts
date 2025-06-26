import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import jwt from 'jsonwebtoken'; // Import jsonwebtoken
import prisma from '../../../../lib/prisma'; // Import prisma

// NOTE: This part requires your Firebase Admin SDK private key.
// Store your service account key file securely, e.g., in a .env variable or directly in a non-public environment.
// For development, you might load it directly or use a base64 encoded string.
// DO NOT expose your private key in client-side code.

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const adminAuth = getAuth();
const JWT_SECRET = process.env.JWT_SECRET!; // Define JWT_SECRET

export async function POST(req: NextRequest) {
  try {
    const { firebaseIdToken } = await req.json();

    if (!firebaseIdToken) {
      return NextResponse.json({ error: 'Firebase ID token is required' }, { status: 400 });
    }

    // 1. Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(firebaseIdToken);
    const uid = decodedToken.uid;

    // 2. Look up or create user in your database (Prisma example)
    let userFromDb = await prisma.user.findUnique({
      where: { email: decodedToken.email || '' }, // Ensure email is not undefined
    });

    if (!userFromDb) {
      // Create new user if not found
      userFromDb = await prisma.user.create({
        data: {
          id: uid, // Use Firebase UID as the ID
          email: decodedToken.email!,
          fullName: decodedToken.name || decodedToken.email!,
          role: 'user',
        },
      });
    }

    // 3. Create your custom JWT
    // This JWT will be used for subsequent authentication with your backend
    const customToken = jwt.sign(
      { userId: userFromDb.id, email: userFromDb.email, role: userFromDb.role },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    return NextResponse.json({ user: userFromDb, token: customToken }, { status: 200 });

  } catch (error: any) {
    console.error('Error in /api/auth/google-login:', error);
    if (error.code === 'auth/invalid-credential') {
      return NextResponse.json({ error: 'Invalid Firebase ID token' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 