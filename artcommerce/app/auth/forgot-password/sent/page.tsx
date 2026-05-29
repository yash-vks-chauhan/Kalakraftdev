import Link from 'next/link'
import { ArrowRight, Mail, RotateCcw } from 'lucide-react'

import AuthShell from '../../AuthShell'
import { Banner } from '../../_components/AuthBits'
import { Button } from '@/components/ui/button'

const RESET_STEPS = [
  { label: 'Request code', description: 'Start with your email' },
  { label: 'Verify reset', description: 'Confirm and set new password' },
  { label: 'Sign back in', description: 'Use the updated password' },
]

export default async function ForgotPasswordSentPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email = '' } = await searchParams
  const normalizedEmail = email.trim().toLowerCase()
  const verifyHref = `/auth/forgot-password/verify${
    normalizedEmail ? `?email=${encodeURIComponent(normalizedEmail)}` : ''
  }`
  const requestHref = `/auth/forgot-password${
    normalizedEmail ? `?email=${encodeURIComponent(normalizedEmail)}` : ''
  }`

  return (
    <AuthShell
      eyebrow="Check your inbox"
      title="Reset code on the way"
      subtitle="Open your email and use the verification code to finish the reset."
      steps={{ current: 2, items: RESET_STEPS }}
      footer={
        <>
          Need to start over?{' '}
          <Link
            href={requestHref}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Request another code
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Banner tone="success">
          If an account exists for{' '}
          <strong className="font-semibold">
            {normalizedEmail || 'that email address'}
          </strong>
          , a reset code is on the way now.
        </Banner>

        <div className="flex flex-col items-start gap-4 rounded-lg border bg-card p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 ring-1 ring-border">
            <Mail className="h-5 w-5 text-foreground" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              Codes expire in five minutes
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              The cleanest path is to jump straight into verification while the
              message is fresh — your code is six characters, all caps.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button asChild className="h-10 flex-1 gap-2">
              <Link href={verifyHref}>
                Enter reset code
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-10 gap-2 sm:flex-1">
              <Link href={requestHref}>
                <RotateCcw className="h-4 w-4" />
                Resend code
              </Link>
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Can&apos;t find the email? Check your spam folder, or{' '}
          <Link
            href="/contact"
            className="text-foreground underline-offset-4 hover:underline"
          >
            contact support
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  )
}
