// File: app/api/admin/support/tickets/[id]/reply/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../../../../lib/prisma";
import pusher from "../../../../../../../lib/pusher";
import { randomUUID } from 'crypto';
import { requireAdminUser } from "../../../../../../../lib/session-auth";
import { isAllowedOrigin } from "@/lib/security";
import { sanitizeSupportAttachments } from "@/lib/supportAttachments";

const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_SIZE_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED_STATUSES = ['open', 'pending', 'resolved', 'closed'];

function validateAttachments(attachments: any[]) {
  if (!Array.isArray(attachments)) return 'Attachments must be an array';
  if (attachments.length > MAX_ATTACHMENTS) return `Maximum ${MAX_ATTACHMENTS} images allowed`;
  for (const att of attachments) {
    if (!att || typeof att !== 'object') return 'Invalid attachment payload';
    if (!att.url || typeof att.url !== 'string') return 'Each attachment must include a URL';
    if (att.type && typeof att.type === 'string' && !att.type.startsWith('image')) {
      return 'Only image attachments are allowed';
    }
    if (typeof att.size === 'number' && att.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return 'Each image must be 3MB or smaller';
    }
  }
  return null;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 1) Get the ticketId
  const { id: ticketId } = params;

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

  const attachmentError = validateAttachments(attachments);
  if (attachmentError) {
    return NextResponse.json({ error: attachmentError }, { status: 400 });
  }
  const safeAttachments = sanitizeSupportAttachments(attachments);

  // 3) Record the agent's message
  const message = await prisma.supportMessage.create({
    // @ts-ignore keeping until prisma types regenerated
    data: { 
      id: randomUUID(),
      ticketId, 
      sender: "agent", 
      content: reply, 
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
        subject: `Re: ${ticket.subject}`,
        htmlContent: `<p>${reply}</p><p>Your ticket status is now <strong>${normalizedStatus}</strong>.</p>`,
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
