// File: app/api/admin/support/tickets/[id]/reply/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../../../../lib/prisma";
import pusher from "../../../../../../../lib/pusher";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1) Get the ticketId
  const { id: ticketId } = await params;

  // 2) Parse JSON body instead of formData()
  const { reply, status, attachments = [] } = (await request.json()) as {
    reply: string;
    status: string;
    attachments?: any[];
  };

  // 3) Record the agent's message
  const message = await prisma.supportMessage.create({
    // @ts-ignore keeping until prisma types regenerated
    data: { ticketId, sender: "agent", content: reply, attachments } as any,
  });

  // 4) Update the ticket's status
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
  });

  // Broadcast via Pusher to both admin & customer listeners
  try {
    await pusher.trigger(`support-ticket-${ticketId}`, "new-message", { message });
    await pusher.trigger(`support-ticket-${ticketId}`, "status-changed", { status });
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