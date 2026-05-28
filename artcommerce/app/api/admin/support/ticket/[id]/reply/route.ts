// File: app/api/admin/support/tickets/[id]/reply/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../../../../lib/prisma";
import pusher from "../../../../../../../lib/pusher";
import { randomUUID } from 'crypto';
import { requireAdminUser } from "../../../../../../../lib/session-auth";
import { isAllowedOrigin } from "@/lib/security";
import { sanitizeSupportAttachments, validateSupportAttachments } from "@/lib/supportAttachments";
import { cleanEmailHeader, escapeHtml } from "@/lib/emailContent";

const ALLOWED_STATUSES = ['open', 'pending', 'resolved', 'closed'];
const MAX_REPLY_LENGTH = 5000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 1) Get the ticketId
  const { id: ticketId } = await params;

  // 2) Parse JSON body instead of formData()
  const { reply, status, attachments = [] } = (await request.json()) as {
    reply: string;
    status: string;
    attachments?: any[];
  };

  const normalizedStatus = status?.toLowerCase?.();
  if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  if (!reply?.trim() && attachments.length === 0) {
    return NextResponse.json({ error: 'Reply or attachment is required' }, { status: 400 });
  }
  const trimmedReply = typeof reply === 'string' ? reply.trim() : '';
  if (trimmedReply.length > MAX_REPLY_LENGTH) {
    return NextResponse.json(
      { error: `Reply must be ${MAX_REPLY_LENGTH} characters or fewer` },
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

  // 3) Record the agent's message
  const message = await prisma.supportMessage.create({
    // @ts-ignore keeping until prisma types regenerated
    data: { 
      id: randomUUID(),
      ticketId, 
      sender: "agent", 
      content: trimmedReply, 
      attachments: safeAttachments,
    } as any,
  });
  const safeMessage = { ...message, attachments: sanitizeSupportAttachments((message as any).attachments) };

  // 4) Update the ticket's status
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: normalizedStatus },
  }).catch((err: any) => {
    if (err?.code === 'P2025') {
      return null;
    }
    throw err;
  });

  if (!ticket) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Broadcast via Pusher to both admin & customer listeners
  try {
    await pusher.trigger(`private-support-ticket-${ticketId}`, "new-message", { message: safeMessage });
    await pusher.trigger(`private-support-ticket-${ticketId}`, "status-changed", { status: normalizedStatus });
  } catch (err) {
    console.error("Pusher trigger failed: ", err);
  }

  // 5) Send the e-mail inline
  try {
    const resp = await fetch("https://api.sendinblue.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.SENDINBLUE_API_KEY!,
      },
      body: JSON.stringify({
        sender: {
          name: "Artcommerce Support",
          email: process.env.SENDINBLUE_FROM_EMAIL!,
        },
        to: [{ email: ticket.email }],
        subject: cleanEmailHeader(`Re: ${ticket.subject}`),
        htmlContent: `<p>${escapeHtml(trimmedReply).replace(/\n/g, '<br/>')}</p><p>Your ticket status is now <strong>${escapeHtml(normalizedStatus)}</strong>.</p>`,
      }),
    });
    if (!resp.ok) {
      console.error("Sendinblue error", resp.status, await resp.text());
    }
  } catch (err) {
    console.error("Email send failed:", err);
  }

  // 6) Return JSON so the client fetch sees res.ok === true
  return NextResponse.json({ ok: true, message: safeMessage });
}
