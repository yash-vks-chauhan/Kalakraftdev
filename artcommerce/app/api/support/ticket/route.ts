// File: app/api/support/ticket/route.ts
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function POST(request: Request) {
  // Detect if multipart or JSON
  const contentType = request.headers.get('content-type') || '';

  let name = '', email = '', subject = '', message = '';
  let attachments: any[] = [];
  let issueCategory: string | null = null;
  let productId: number | null = null;

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    name = (form.get('name') as string) || '';
    email = (form.get('email') as string) || '';
    subject = (form.get('subject') as string) || '';
    message = (form.get('message') as string) || '';
    issueCategory = (form.get('issueCategory') as string) || null;
    productId = form.get('productId') ? Number(form.get('productId')) : null;

    // Collect attachments meta only (this demo doesn't persist files)
    const fileBlobs = form.getAll('files') as File[];
    attachments = fileBlobs.map((file) => ({ name: file.name, size: file.size, type: file.type }));
  } else {
    // Fallback to raw JSON body
    const body = await request.json();
    ({ name, email, subject, message, attachments = [], issueCategory = null, productId = null } = body);
  }

  // 2) Create the support ticket in the database (store category/product info as part of subject for now)
  const fullSubject = issueCategory ? `[${issueCategory}] ${subject}` : subject;
  const ticket = await prisma.supportTicket.create({
    data: { name, email, subject: fullSubject, message },
  });

  // If attachments provided, create a first SupportMessage storing them
  if (attachments.length > 0) {
    // @ts-ignore until prisma types regenerated
    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        sender: 'customer',
        content: '',
        attachments,
      } as any,
    });
  }

  // 3) Send confirmation email via Sendinblue REST API (inline, no helper)
  try {
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
        subject: `We received your request: ${fullSubject}`,
        htmlContent: `<p>Hi ${name},</p>
          <p>Thanks for contacting our support team! Your ticket ID is <strong>${ticket.id}</strong>. We will get back to you shortly.</p>`,
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('Sendinblue API error:', resp.status, errorText);
    }
  } catch (err) {
    console.error('Sendinblue call failed', err);
  }

  // 4) Return the created ticket JSON to the client
  return NextResponse.json(ticket);
}