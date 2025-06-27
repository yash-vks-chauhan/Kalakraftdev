// File: app/api/support/my-tickets/route.ts
import { NextResponse } from 'next/server';
import { firebaseAdmin } from '../../../../lib/firebase-admin';
import prisma from '../../../../lib/prisma';

export async function GET(request: Request) {
  let userId: string | undefined = undefined;
  let email: string | undefined = undefined;

  // Try Firebase token first (mobile / social auth)
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded: any = await firebaseAdmin.auth().verifyIdToken(token);
      email = decoded.email;
      userId = decoded.uid;
    } catch {
      // ignore – may not be a Firebase token
    }
  }

  // Fallback: accept plain ?email= query when token cannot be verified (dashboard fetch)
  if (!email && !userId) {
    const { searchParams } = new URL(request.url);
    email = searchParams.get('email') || undefined;
  }

  if (!email && !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If we only have email, look up the user first
  if (email && !userId) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    userId = user.id;
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ tickets });
}