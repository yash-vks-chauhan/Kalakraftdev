import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { requireAdminUser } from '../../../../../lib/session-auth';

export async function GET(request: Request) {
  const admin = await requireAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(tickets);
}
