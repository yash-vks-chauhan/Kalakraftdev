// File: app/api/support/ticket/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import pusher from "../../../../../lib/pusher";
import { randomUUID } from 'crypto';
import { getAuthContext } from "../../../../../lib/auth";

const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_SIZE_BYTES = 3 * 1024 * 1024; // 3MB
const MAX_ATTACHMENT_DIMENSION = 1080;

function validateAttachments(attachments: any[]) {
  if (!Array.isArray(attachments)) return 'Attachments must be an array';
  if (attachments.length > MAX_ATTACHMENTS) return `Maximum ${MAX_ATTACHMENTS} images allowed`;
  for (const att of attachments) {
    if (!att || typeof att !== 'object') return 'Invalid attachment payload';
    if (att.type && typeof att.type === 'string' && !att.type.startsWith('image')) {
      return 'Only image attachments are allowed';
    }
    if (typeof att.size === 'number' && att.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return 'Each image must be 3MB or smaller';
    }
    if (typeof att.width === 'number' && att.width > MAX_ATTACHMENT_DIMENSION) {
      return 'Images must be at most 1080px in width';
    }
    if (typeof att.height === 'number' && att.height > MAX_ATTACHMENT_DIMENSION) {
      return 'Images must be at most 1080px in height';
    }
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail =
    auth.email ||
    (await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true },
    }))?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { messages: true },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (auth.role !== 'admin' && ticket.email !== userEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(ticket);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail =
    auth.email ||
    (await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true },
    }))?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: ticketId } = params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { email: true },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (auth.role !== 'admin' && ticket.email !== userEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // parse JSON body { content: string, attachments?: any[] }
  const { content, attachments = [] } = (await request.json()) as {
    content: string;
    attachments?: any[];
  };

  const attachmentError = validateAttachments(attachments);
  if (attachmentError) {
    return NextResponse.json({ error: attachmentError }, { status: 400 });
  }

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
    await pusher.trigger(`private-support-ticket-${ticketId}`, "new-message", {
      message,
    });
  } catch (err) {
    console.error("Pusher trigger failed:", err);
  }

  return NextResponse.json({ ok: true });
}
