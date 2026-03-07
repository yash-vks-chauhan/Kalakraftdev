// File: app/api/support/ticket/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import pusher from "../../../../../lib/pusher";
import { randomUUID } from 'crypto';
import { isAllowedOrigin } from "@/lib/security";
import { sanitizeSupportAttachments, validateSupportAttachments } from "@/lib/supportAttachments";
import { consumeRateLimit, getClientIp } from "../../../../../lib/rateLimit";
import { getAuthenticatedUser } from "../../../../../lib/session-auth";

const MESSAGE_WINDOW_MS = 15 * 60 * 1000;
const MAX_MESSAGES_PER_WINDOW = 20;
const MAX_MESSAGE_LENGTH = 5000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthenticatedUser(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail =
    auth.email ||
    (await prisma.user.findUnique({
      where: { id: auth.id },
      select: { email: true },
    }))?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (auth.role !== 'admin' && ticket.email !== userEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const safeMessages = ticket.messages.map((msg: any) => ({
    ...msg,
    attachments: sanitizeSupportAttachments(msg.attachments),
  }));
  return NextResponse.json({ ...ticket, messages: safeMessages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthenticatedUser(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userEmail =
    auth.email ||
    (await prisma.user.findUnique({
      where: { id: auth.id },
      select: { email: true },
    }))?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: ticketId } = await params;

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
  const clientIp = getClientIp(request);
  const limit = consumeRateLimit(`support:ticket:reply:${auth.id}:ticket:${ticketId}:ip:${clientIp}`, {
    windowMs: MESSAGE_WINDOW_MS,
    max: MAX_MESSAGES_PER_WINDOW,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many messages. Please try again later.' },
      { status: 429 },
    );
  }

  // parse JSON body { content: string, attachments?: any[] }
  const { content, attachments = [] } = (await request.json()) as {
    content: string;
    attachments?: any[];
  };

  if (!content?.trim() && attachments.length === 0) {
    return NextResponse.json({ error: "Message or attachment is required" }, { status: 400 });
  }
  const trimmedContent = typeof content === 'string' ? content.trim() : '';
  if (trimmedContent.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
      { status: 400 },
    );
  }

  const validatedAttachments = validateSupportAttachments(attachments);
  if (!validatedAttachments.ok) {
    return NextResponse.json(
      { error: 'error' in validatedAttachments ? validatedAttachments.error : 'Invalid attachment payload' },
      { status: 400 },
    );
  }
  const safeAttachments = validatedAttachments.attachments;

  // Create the message
  // @ts-ignore – attachments field added after latest Prisma migration
  const message = await prisma.supportMessage.create({
    data: { 
      id: randomUUID(),
      ticketId, 
      sender: "customer", 
      content: trimmedContent,
      attachments: safeAttachments,
    } as any,
  });
  const safeMessage = { ...message, attachments: sanitizeSupportAttachments((message as any).attachments) };

  // Broadcast via Pusher
  try {
    await pusher.trigger(`private-support-ticket-${ticketId}`, "new-message", {
      message: safeMessage,
    });
  } catch (err) {
    console.error("Pusher trigger failed:", err);
  }

  return NextResponse.json({ ok: true, message: safeMessage });
}
