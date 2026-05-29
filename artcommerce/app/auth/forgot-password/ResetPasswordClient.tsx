'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, KeyRound, Loader2, Mail, RotateCcw, ShieldCheck } from 'lucide-react'

import AuthShell from '../AuthShell'
import { Banner, PasswordInput, SuccessRedirect } from '../_components/AuthBits'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ResetPasswordClientProps = {
  initialCode?: string
  initialEmail?: string
}

const RESET_STEPS = [
  { label: 'Request code', description: 'Start with your email' },
  { label: 'Verify reset', description: 'Confirm and set new password' },
  { label: 'Sign back in', description: 'Use the updated password' },
]

const LOADING_MESSAGES = [
  'Verifying your reset code…',
  'Updating your password securely…',
  'Preparing sign-in…',
]

export default function ResetPasswordClient({
  initialCode = '',
  initialEmail = '',
}: ResetPasswordClientProps) {
  const router = useRouter()
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState(initialCode.toUpperCase())
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingIndex, setLoadingIndex] = useState(0)

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

  const loginHref = useMemo(() => {
    const params = new URLSearchParams()
    if (email.trim()) params.set('email', email.trim().toLowerCase())
    params.set('reset', '1')
    return `/auth/login?${params.toString()}`
  }, [email])

  const requestHref = useMemo(() => {
    return `/auth/forgot-password${
      email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''
    }`
  }, [email])

  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword
  const passwordsMismatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword !== confirmPassword

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!email.trim()) return setError('Please enter your email address.')
    if (!code.trim()) return setError('Please enter the reset code from your email.')
    if (!newPassword.trim() || !confirmPassword.trim())
      return setError('Please complete both password fields.')
    if (newPassword.length < 8)
      return setError('Password must be at least 8 characters.')
    if (newPassword !== confirmPassword)
      return setError('Passwords must match.')

    setLoading(true)

    try {
      const response = await fetch('/api/auth/confirm-password-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: code.trim().toUpperCase(),
          newPassword,
          confirmPassword,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset your password')
      }

      setSuccess(true)
      window.setTimeout(() => {
        router.replace(loginHref)
      }, 900)
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to reset your password')
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow={success ? 'Done' : 'Verify reset'}
      title={success ? 'Password updated' : 'Finish your reset'}
      subtitle={
        success
          ? 'Your account is ready for sign-in again.'
          : 'Enter the code from your inbox and pick a new password.'
      }
      steps={{ current: success ? 3 : 2, items: RESET_STEPS }}
      footer={
        <>
          Remembered it already?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      {success ? (
        <SuccessRedirect
          message="Password updated. Taking you back to sign in…"
        />
      ) : (
        <div className="flex flex-col gap-5">
          {error && <Banner tone="error">{error}</Banner>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="grid gap-1.5">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reset-email"
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

            <div className="grid gap-1.5">
              <Label htmlFor="reset-code">Reset code</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reset-code"
                  type="text"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.toUpperCase().replace(/\s/g, ''))
                  }
                  placeholder="ABC123"
                  autoComplete="one-time-code"
                  disabled={loading}
                  maxLength={8}
                  required
                  className={cn(
                    'pl-9 font-mono tracking-[0.32em] uppercase text-center'
                  )}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(v) => {
                  setNewPassword(v)
                  if (error) setError(null)
                }}
                visible={showNew}
                onToggle={() => setShowNew((v) => !v)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(v) => {
                  setConfirmPassword(v)
                  if (error) setError(null)
                }}
                visible={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
                placeholder="Repeat your new password"
                autoComplete="new-password"
                disabled={loading}
              />
              {passwordsMatch && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  Passwords match
                </p>
              )}
              {passwordsMismatch && (
                <p className="text-[11px] text-destructive">
                  Passwords do not match
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-1 h-10 w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {LOADING_MESSAGES[loadingIndex]}
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Reset password
                </>
              )}
            </Button>
          </form>

          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
                <RotateCcw className="h-3 w-3 text-muted-foreground" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-medium text-foreground">
                  Code expired?
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Reset codes are valid for five minutes only.
                </span>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={requestHref}>
                Request a new code
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </AuthShell>
  )
}
