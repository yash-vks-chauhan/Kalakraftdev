// File: app/api/support/ticket/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import pusher from "../../../../../lib/pusher";
import { randomUUID } from 'crypto';

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

  // parse JSON body { content: string, attachments?: any[] }
  const { content, attachments = [] } = (await request.json()) as {
    content: string;
    attachments?: any[];
  };

  // Create the message
  // @ts-ignore – attachments field added after latest Prisma migration
  const message = await prisma.supportMessage.create({
    data: { 
      id: randomUUID(),
      ticketId, 
      sender: "customer", 
      content, 
      attachments 
    } as any,
  });

  // Broadcast via Pusher
  try {
    await pusher.trigger(`support-ticket-${ticketId}`, "new-message", {
      message,
    });
  } catch (err) {
    console.error("Pusher trigger failed:", err);
  }

  return NextResponse.json({ ok: true });
}