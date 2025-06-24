// File: app/api/support/ticket/route.ts
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function POST(request: Request) {
  // 1) Parse the incoming ticket data
  const { name, email, subject, message } = await request.json();

  // 2) Create the support ticket in the database
  const ticket = await prisma.supportTicket.create({
    data: { name, email, subject, message },
  });

  // 3) Send confirmation email via Sendinblue REST API (inline, no helper)
  const resp = await fetch('https://api.sendinblue.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.SENDINBLUE_API_KEY!,
    },
    body: JSON.stringify({
      sender: {
        name: 'Artcommerce Support',
        email: process.env.SENDINBLUE_FROM_EMAIL!,
      },
      to: [{ email }],
      subject: `We received your request: ${subject}`,
      htmlContent: `<p>Hi ${name},</p>
        <p>Thanks for contacting our support team! Your ticket ID is <strong>${ticket.id}</strong>. We will get back to you shortly.</p>`,
    }),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    console.error('Sendinblue API error:', resp.status, errorText);
    // Note: we still return the ticket; you might surface an error status if desired
  }

  // 4) Return the created ticket JSON to the client
  return NextResponse.json(ticket);
}