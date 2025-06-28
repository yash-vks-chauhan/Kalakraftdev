// File: app/api/support/my-tickets/route.ts
import { NextResponse } from 'next/server';
import { firebaseAdmin } from '../../../../lib/firebase-admin';
import prisma from '../../../../lib/prisma';

export async function GET(request: Request) {
  let email: string | undefined = undefined;

  // Try Firebase token first (mobile / social auth)
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded: any = await firebaseAdmin.auth().verifyIdToken(token);
      email = decoded.email;
    } catch {
      // ignore – may not be a Firebase token
    }
  }

  // Fallback: accept plain ?email= query when token cannot be verified (dashboard fetch)
  if (!email) {
    const { searchParams } = new URL(request.url);
    email = searchParams.get('email') || undefined;
  }

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ tickets });
}