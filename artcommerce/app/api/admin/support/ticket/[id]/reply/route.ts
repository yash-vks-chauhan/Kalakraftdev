// File: app/api/admin/support/tickets/[id]/reply/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminFromRequest } from "@/lib/auth-helpers";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!requireAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1) Get the ticketId
  const { id: ticketId } = params;

  // 2) Parse JSON body instead of formData()
  const { reply, status } = await request.json() as {
    reply: string;
    status: string;
  };

  if (!reply) {
    return NextResponse.json({ error: 'Reply is required' }, { status: 400 });
  }
  const allowedStatuses = ['open', 'pending', 'closed'];
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // 3) Record the agent’s message
  await prisma.supportMessage.create({
    data: { ticketId, sender: "agent", content: reply },
  });

  // 4) Update the ticket’s status
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
  });

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
        htmlContent: `<p>${reply}</p><p>Your ticket status is now <strong>${status}</strong>.</p>`,
      }),
    });
    if (!resp.ok) {
      console.error("Sendinblue error", resp.status, await resp.text());
    }
  } catch (err) {
    console.error("Email send failed:", err);
  }

  // 6) Return JSON so the client fetch sees res.ok === true
  return NextResponse.json({ ok: true });
}
