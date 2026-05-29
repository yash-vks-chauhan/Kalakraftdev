// File: app/api/support/my-tickets/route.ts
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/session-auth';

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: auth.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ tickets });
}
