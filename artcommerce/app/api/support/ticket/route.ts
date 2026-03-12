// File: app/api/support/ticket/route.ts
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { randomUUID } from 'crypto';
import { getAuthContext } from '../../../../lib/auth';
import { isAllowedOrigin } from '@/lib/security';
import { validateSupportAttachments } from '@/lib/supportAttachments';
import { storeSupportAttachment } from '@/lib/supportUploadStorage';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';
import { validateUploadBuffer } from '@/lib/uploadGuard';

const TICKET_WINDOW_MS = 15 * 60 * 1000;
const MAX_TICKETS_PER_WINDOW = 5;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;

export async function POST(request: Request) {
  const auth = getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
  const clientIp = getClientIp(request);
  const limit = consumeRateLimit(`support:ticket:create:${auth.userId}:ip:${clientIp}`, {
    windowMs: TICKET_WINDOW_MS,
    max: MAX_TICKETS_PER_WINDOW,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many support requests. Please try again later.' },
      { status: 429 },
    );
  }

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

    const fileBlobs = (form.getAll('files') as File[]).slice(0, 4);
    for (const file of fileBlobs) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const validated = validateUploadBuffer({
        buffer,
        filename: file.name || 'attachment',
        mimeFromHeader: file.type || '',
        maxSizeBytes: 3 * 1024 * 1024,
      });

      if ('response' in validated) {
        return validated.response;
      }

      try {
        attachments.push(
          await storeSupportAttachment({
            buffer: validated.upload.buffer,
            filename: validated.upload.filename,
            mimeType: validated.upload.mimeType,
            userId: auth.userId,
          }),
        );
      } catch (err) {
        console.error('Support ticket attachment upload failed', err);
        const message = err instanceof Error ? err.message : ''
        const status = /not configured/i.test(message)
          ? 503
          : /1080px/i.test(message)
            ? 400
            : 500
        return NextResponse.json(
          {
            error: /not configured/i.test(message)
              ? 'Support attachments are temporarily unavailable'
              : /1080px/i.test(message)
                ? message
              : 'Failed to upload attachment',
          },
          { status },
        );
      }
    }
  } else {
    // Fallback to raw JSON body
    const body = await request.json();
    ({ name, subject, message, attachments = [], issueCategory = null, productId = null } = body);
  }

  if (!subject.trim()) {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
  }
  if (!message.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }
  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();
  if (trimmedSubject.length > MAX_SUBJECT_LENGTH) {
    return NextResponse.json(
      { error: `Subject must be ${MAX_SUBJECT_LENGTH} characters or fewer` },
      { status: 400 },
    );
  }
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
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

  // 2) Create the support ticket in the database (store category/product info as part of subject for now)
  const fullSubject = issueCategory ? `[${issueCategory}] ${trimmedSubject}` : trimmedSubject;
  const ticket = await prisma.supportTicket.create({
    data: { 
      id: randomUUID(),
      name: authenticatedName || name || 'Customer', 
      email: authenticatedEmail, 
      subject: fullSubject, 
      message: trimmedMessage,
    },
  });

  // If attachments provided, create a first SupportMessage storing them
  if (safeAttachments.length > 0) {
    // @ts-ignore until prisma types regenerated
    await prisma.supportMessage.create({
      data: {
        id: randomUUID(),
        ticketId: ticket.id,
        sender: 'customer',
        content: '',
        attachments: safeAttachments,
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
