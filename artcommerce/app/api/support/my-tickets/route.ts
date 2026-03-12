// File: app/api/support/my-tickets/route.ts
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthContext } from '../../../../lib/auth';

export async function GET(request: Request) {
  const auth = getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let email = auth.email;
  if (!email) {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true },
    });
    email = user?.email || undefined;
  }

  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tickets = await prisma.supportTicket.findMany({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ tickets });
}
