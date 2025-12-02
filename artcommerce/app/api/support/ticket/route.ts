// File: app/api/support/ticket/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSupportAuth } from '@/lib/support-auth'

export async function POST(request: Request) {
  const auth = await getSupportAuth(request)
  if (!auth?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { subject, message } = await request.json()
  if (!subject || !message) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
  }

  const user =
    (auth.userId
      ? await prisma.user.findUnique({
          where: { id: auth.userId },
          select: { fullName: true, email: true },
        })
      : null) ||
    (await prisma.user.findUnique({
      where: { email: auth.email },
      select: { fullName: true, email: true },
    }))
  const email = user?.email || auth.email
  const fullName = user?.fullName || 'Customer'

  const ticket = await prisma.supportTicket.create({
    data: {
      name: fullName,
      email,
      subject,
      message,
      status: 'open',
    },
  })

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
      htmlContent: `<p>Hi ${fullName || 'there'},</p>
        <p>Thanks for contacting our support team! Your ticket ID is <strong>${ticket.id}</strong>. We will get back to you shortly.</p>`,
    }),
  }).catch(() => null)

  if (resp && !resp.ok) {
    console.error('Sendinblue API error:', resp.status)
  }

  return NextResponse.json({ id: ticket.id })
}
