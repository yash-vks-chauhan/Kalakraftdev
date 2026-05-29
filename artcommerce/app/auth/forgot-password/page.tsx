'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Mail } from 'lucide-react'

import AuthShell from '../AuthShell'
import { Banner } from '../_components/AuthBits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const RESET_STEPS = [
  { label: 'Request code', description: 'Start with your email' },
  { label: 'Verify reset', description: 'Confirm and set new password' },
  { label: 'Sign back in', description: 'Use the updated password' },
]

const LOADING_MESSAGES = [
  'Checking your request…',
  'Generating a secure reset code…',
  'Preparing the next step…',
]

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function ForgotPasswordRequestPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingIndex, setLoadingIndex] = useState(0)

  useEffect(() => {
    const emailParam = new URLSearchParams(window.location.search).get('email')
    if (emailParam) setEmail(emailParam)
  }, [])

  useEffect(() => {
    if (!loading) {
      setLoadingIndex(0)
      return
    }
    const id = window.setInterval(() => {
      setLoadingIndex((i) =>
        i < LOADING_MESSAGES.length - 1 ? i + 1 : i
      )
    }, 900)
    return () => window.clearInterval(id)
  }, [loading])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setError('Enter the email address tied to your account.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/request-password-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Unable to start password reset')
      }

      router.push(
        `/auth/forgot-password/sent?email=${encodeURIComponent(normalizedEmail)}`
      )
    } catch (submitError: any) {
      setError(submitError?.message || 'Unable to start password reset')
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Forgot password"
      title="Reset your password"
      subtitle="We'll email a short verification code so you can set a new password — under a minute, start to finish."
      steps={{ current: 1, items: RESET_STEPS }}
      footer={
        <>
          Remember your password?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Banner tone="error">{error}</Banner>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="forgot-email">Account email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (error) setError(null)
                }}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
                required
                className="pl-9"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-10 w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {LOADING_MESSAGES[loadingIndex]}
              </>
            ) : (
              <>
                Send reset code
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground">
          Codes expire in 5 minutes. Sent only to the address above.
        </p>
      </div>
    </AuthShell>
  )
}
