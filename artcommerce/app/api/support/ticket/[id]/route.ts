// File: app/api/support/ticket/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { messages: true },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(ticket);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ticketId } = await params;

  // parse the incoming JSON body { content: string }
  const { content } = (await request.json()) as { content: string };

  // create a new customer message
  await prisma.supportMessage.create({
    data: { ticketId, sender: "customer", content },
  });

  // return success
  return NextResponse.json({ ok: true });
}