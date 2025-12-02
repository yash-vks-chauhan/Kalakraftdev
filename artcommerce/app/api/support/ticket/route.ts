// File: app/api/support/ticket/route.ts
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { randomUUID } from 'crypto';
import { getAuthContext } from '../../../../lib/auth';

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

export async function POST(request: Request) {
  const auth = getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { fullName: true, email: true },
  });
  const authenticatedEmail = user?.email || auth.email;
  if (!authenticatedEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const authenticatedName = user?.fullName;

  // Detect if multipart or JSON
  const contentType = request.headers.get('content-type') || '';

  let name = '', subject = '', message = '';
  let attachments: any[] = [];
  let issueCategory: string | null = null;
  let productId: number | null = null;

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    name = (form.get('name') as string) || '';
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
    ({ name, subject, message, attachments = [], issueCategory = null, productId = null } = body);
  }

  const attachmentError = validateAttachments(attachments);
  if (attachmentError) {
    return NextResponse.json({ error: attachmentError }, { status: 400 });
  }

  // 2) Create the support ticket in the database (store category/product info as part of subject for now)
  const fullSubject = issueCategory ? `[${issueCategory}] ${subject}` : subject;
  const ticket = await prisma.supportTicket.create({
    data: { 
      id: randomUUID(),
      name: authenticatedName || name || 'Customer', 
      email: authenticatedEmail, 
      subject: fullSubject, 
      message 
    },
  });

  // If attachments provided, create a first SupportMessage storing them
  if (attachments.length > 0) {
    // @ts-ignore until prisma types regenerated
    await prisma.supportMessage.create({
      data: {
        id: randomUUID(),
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
        to: [{ email: authenticatedEmail }],
        subject: `We received your request: ${fullSubject}`,
        htmlContent: `<p>Hi ${authenticatedName || name || 'there'},</p>
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
