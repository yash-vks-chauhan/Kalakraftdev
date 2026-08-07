// File: app/auth/_components/ResetFlow.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  CircleHelp,
  Clock,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react'

import AuthShell from '../AuthShell'
import {
  Banner,
  EmailInput,
  EMAIL_PATTERN,
  PasswordInput,
  PasswordRequirements,
  PasswordStrength,
  SuccessRedirect,
} from './AuthBits'
import { OTP_LENGTH, OtpInput, normalizeOtp } from './OtpInput'
import { cn } from '@/lib/utils'
import { isStrongPassword } from '@/lib/password-policy'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export type ResetPane = 'email' | 'code' | 'password' | 'done'

type Busy = 'idle' | 'send' | 'resend' | 'confirm'

const FORM_ID = 'reset-form'

/** Mirrors OTP_EXPIRY_MS in app/api/auth/request-password-change. */
const CODE_TTL_MS = 5 * 60 * 1000
/**
 * The API answers rate-limited requests with a plain `{ ok: true }` so an
 * attacker can't probe it, which means the only honest signal we can give
 * is our own cooldown.
 */
const RESEND_COOLDOWN_MS = 30 * 1000

const PANES: ResetPane[] = ['email', 'code', 'password', 'done']

const COPY: Record<
  Exclude<ResetPane, 'done'>,
  { step: string; title: string; blurb: string; cta: string; busy: string }
> = {
  email: {
    step: 'Step 1 of 3',
    title: "What's your email?",
    blurb: "We'll send a six-character code to the address on your account.",
    cta: 'Send reset code',
    busy: 'Sending…',
  },
  code: {
    step: 'Step 2 of 3',
    title: 'Enter the code',
    blurb: 'Six characters, letters and numbers. Paste works.',
    cta: 'Continue',
    busy: 'Continue',
  },
  password: {
    step: 'Step 3 of 3',
    title: 'Pick a new password',
    blurb: "Choose something you haven't used here before.",
    cta: 'Reset password',
    busy: 'Updating…',
  },
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

/** Code problems belong on the code pane; everything else on the password pane. */
function isCodeProblem(message: string): boolean {
  return /otp|code|too many attempts/i.test(message)
}

export default function ResetFlow({
  initialPane = 'email',
  initialEmail = '',
  initialCode = '',
}: {
  initialPane?: ResetPane
  initialEmail?: string
  initialCode?: string
}) {
  const router = useRouter()

  const [pane, setPane] = useState<ResetPane>(() =>
    initialPane === 'code' && !initialEmail ? 'email' : initialPane
  )
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState(() => normalizeOtp(initialCode))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState<Busy>('idle')

  /**
   * Only set when this session sent the code, so we never invent a
   * countdown for a code that arrived by email link — we have no idea when
   * that one was issued.
   */
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const headingRef = useRef<HTMLHeadingElement>(null)

  const loginHref = useMemo(() => {
    const params = new URLSearchParams()
    const normalized = email.trim().toLowerCase()
    if (normalized) params.set('email', normalized)
    params.set('reset', '1')
    return `/auth/login?${params.toString()}`
  }, [email])

  /* ── ticking clock ─────────────────────────────────────────────── */
  const needsClock =
    (pane === 'code' || pane === 'password') && (expiresAt !== null || cooldownUntil !== null)

  useEffect(() => {
    if (!needsClock) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [needsClock])

  const secondsLeft = expiresAt === null ? null : Math.max(0, Math.ceil((expiresAt - now) / 1000))
  const cooldownLeft =
    cooldownUntil === null ? 0 : Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
  const expired = secondsLeft === 0

  /**
   * A per-second announcement would make the pane unusable with a screen
   * reader, so the visible clock is hidden from the tree and only the two
   * moments that matter get announced.
   */
  const announcement =
    secondsLeft === null
      ? ''
      : expired
      ? 'Your reset code has expired. Request a new one.'
      : secondsLeft <= 60
      ? 'Less than a minute left to use your reset code.'
      : ''

  /* ── pane navigation, with a working back gesture ──────────────── */
  const goPane = useCallback((next: ResetPane, replace = false) => {
    setPane(next)
    setError('')
    setNotice('')

    const url = new URL(window.location.href)
    if (next === 'email') url.searchParams.delete('step')
    else url.searchParams.set('step', next)

    // Same pathname, query only: Next keeps this component mounted, so the
    // typed email and code survive a back gesture.
    window.history[replace ? 'replaceState' : 'pushState'](
      { resetStep: next },
      '',
      `${url.pathname}${url.search}`
    )
  }, [])

  useEffect(() => {
    function onPopState() {
      const step = new URLSearchParams(window.location.search).get('step')
      const target = (PANES.includes(step as ResetPane) ? step : 'email') as ResetPane
      // Never restore into a pane whose prerequisites are gone.
      if (target === 'done') return setPane('email')
      if (target === 'password' && (!email || code.length !== OTP_LENGTH))
        return setPane(email ? 'code' : 'email')
      if (target === 'code' && !email) return setPane('email')
      setPane(target)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [email, code])

  // Move focus to the new heading so the pane change is announced and the
  // keyboard user carries on from the right place.
  useEffect(() => {
    if (pane === 'done') return
    headingRef.current?.focus()
  }, [pane])

  /* ── requests ──────────────────────────────────────────────────── */
  const normalizedEmail = email.trim().toLowerCase()

  async function sendCode(kind: 'send' | 'resend') {
    setError('')
    setNotice('')

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError('Enter the email address tied to your account.')
      return
    }

    setBusy(kind)
    try {
      const response = await fetch('/api/auth/request-password-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Unable to start password reset')

      setExpiresAt(Date.now() + CODE_TTL_MS)
      setCooldownUntil(Date.now() + RESEND_COOLDOWN_MS)
      setNow(Date.now())

      if (kind === 'send') {
        goPane('code')
      } else {
        setCode('')
        setNotice(`New code sent to ${normalizedEmail}.`)
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to start password reset')
    } finally {
      setBusy('idle')
    }
  }

  async function confirmReset() {
    setError('')
    setNotice('')

    if (code.length !== OTP_LENGTH) {
      setError('Enter the six-character code from your email.')
      goPane('code', true)
      return
    }
    if (!isStrongPassword(newPassword)) {
      setError(
        'Password must be 8-128 characters and include uppercase, lowercase, number, and symbol.'
      )
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setBusy('confirm')
    try {
      const response = await fetch('/api/auth/confirm-password-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          otp: code,
          newPassword,
          confirmPassword,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to reset your password')

      // Left busy on purpose — the redirect below is the next thing to happen.
      setPane('done')
      window.setTimeout(() => router.replace(loginHref), 900)
    } catch (err: any) {
      const message = err?.message || 'Failed to reset your password'
      setBusy('idle')
      // A rejected code sends them back a pane rather than leaving them
      // staring at a password field that isn't the problem.
      if (isCodeProblem(message)) {
        goPane('code', true)
        setCode('')
        setError(message)
        return
      }
      setError(message)
    }
  }

  /* ── submit ────────────────────────────────────────────────────── */
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy !== 'idle') return

    if (pane === 'email') return void sendCode('send')
    if (pane === 'code') {
      if (code.length !== OTP_LENGTH) {
        setError('Enter all six characters.')
        return
      }
      if (expired) {
        setError('That code has expired. Send a new one to carry on.')
        return
      }
      // There is no verify-only endpoint — the code is checked when the new
      // password is submitted, and a rejection brings us back here.
      goPane('password')
      return
    }
    if (pane === 'password') return void confirmReset()
  }

  const disabled = busy !== 'idle'
  const activeCopy = pane === 'done' ? null : COPY[pane]

  function primaryAction(className: string) {
    if (!activeCopy) return null
    const label = busy === 'confirm' || busy === 'send' ? activeCopy.busy : activeCopy.cta
    return (
      // Kept enabled and validated on submit, like the sign-in screens: a
      // dead button with no explanation is worse than a clear error.
      <Button
        type="submit"
        form={FORM_ID}
        size="lg"
        disabled={disabled}
        className={className}
      >
        {busy === 'send' || busy === 'confirm' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : pane === 'password' ? (
          <ShieldCheck className="h-4 w-4" />
        ) : null}
        {label}
        {pane !== 'password' && busy === 'idle' && <ArrowRight className="h-4 w-4" />}
      </Button>
    )
  }

  /* ── the expiry row, shared by the code and password panes ─────── */
  function expiryRow() {
    if (secondsLeft === null) {
      return (
        <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Codes expire five minutes after they&apos;re sent
          </span>
          {resendButton()}
        </div>
      )
    }

    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-xs transition-colors',
          expired && 'border-destructive/40 bg-destructive/5',
          !expired && secondsLeft <= 60 && 'border-amber-500/45 bg-amber-500/5'
        )}
      >
        <span
          aria-hidden
          className={cn(
            'flex items-center gap-2 text-muted-foreground',
            expired && 'text-destructive'
          )}
        >
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {expired ? (
            <span>
              <strong className="font-semibold">Code expired</strong> — request a new one
            </span>
          ) : (
            <span>
              Code expires in{' '}
              <strong
                className={cn(
                  'font-semibold tabular-nums text-foreground',
                  secondsLeft <= 60 && 'text-amber-600 dark:text-amber-400'
                )}
              >
                {formatClock(secondsLeft)}
              </strong>
            </span>
          )}
        </span>
        {resendButton()}
      </div>
    )
  }

  function resendButton() {
    return (
      <button
        type="button"
        onClick={() => sendCode('resend')}
        disabled={disabled || cooldownLeft > 0}
        className={cn(
          '-my-2 shrink-0 py-2 text-xs font-semibold underline-offset-4',
          cooldownLeft > 0 || disabled
            ? 'cursor-default text-muted-foreground'
            : 'text-foreground underline hover:no-underline'
        )}
      >
        {busy === 'resend'
          ? 'Sending…'
          : cooldownLeft > 0
          ? `Resend in ${cooldownLeft}s`
          : 'Resend'}
      </button>
    )
  }

  /* ── render ────────────────────────────────────────────────────── */
  return (
    <AuthShell
      mobileCrown
      crownSize="compact"
      crownAction={
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/20"
        >
          <ArrowLeft className="h-3 w-3" />
          Sign in
        </Link>
      }
      crownCopy={
        <>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[9.5px] font-medium uppercase tracking-[0.2em] text-white/85 ring-1 ring-white/15 backdrop-blur">
            <Lock className="h-2.5 w-2.5" />
            Account recovery
          </span>
          <h2 className="text-[24px] font-light leading-[1.15] tracking-tight text-white">
            Let&apos;s get you back
            <span className="ml-1.5 font-serif italic">in.</span>
          </h2>
        </>
      }
      eyebrow={pane === 'done' ? 'Done' : 'Forgot password'}
      title={pane === 'done' ? 'Password updated' : 'Reset your password'}
      subtitle={
        pane === 'done'
          ? 'Your account is ready for sign-in again.'
          : "We'll email a short verification code so you can set a new password — under a minute, start to finish."
      }
      actionBar={pane === 'done' ? undefined : primaryAction('w-full gap-2')}
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
      {pane === 'done' ? (
        <SuccessRedirect message="Password updated. Taking you back to sign in…" />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Three hairlines instead of the old 70px step rail. */}
          <ol
            aria-label={`Step ${PANES.indexOf(pane) + 1} of 3`}
            className="flex gap-1.5"
          >
            {(['email', 'code', 'password'] as const).map((key, index) => {
              const position = PANES.indexOf(pane)
              return (
                <li
                  key={key}
                  aria-current={index === position ? 'step' : undefined}
                  className={cn(
                    'h-[3px] flex-1 rounded-full transition-colors duration-300',
                    index < position && 'bg-emerald-500',
                    index === position && 'bg-foreground',
                    index > position && 'bg-muted'
                  )}
                />
              )
            })}
          </ol>

          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {activeCopy?.step}
            </span>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-semibold tracking-tight outline-none sm:text-2xl"
            >
              {activeCopy?.title}
            </h1>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {activeCopy?.blurb}
            </p>
          </div>

          {notice && <Banner tone="success">{notice}</Banner>}
          {error && <Banner tone="error">{error}</Banner>}

          <span aria-live="polite" className="sr-only">
            {announcement}
          </span>

          <form
            id={FORM_ID}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            noValidate
          >
            {pane === 'email' && (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="reset-email">Account email</Label>
                  <EmailInput
                    id="reset-email"
                    value={email}
                    onChange={(v) => {
                      setEmail(v)
                      if (error) setError('')
                    }}
                    disabled={disabled}
                    leadingIcon={<MailGlyph />}
                  />
                </div>
                <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                  Codes last five minutes and are sent only to this address. If no
                  account matches, nothing is sent — and we won&apos;t say which.
                </p>
              </>
            )}

            {pane === 'code' && (
              <>
                {/* The address is shown, never re-typed: an edited email
                    silently stops matching the code that was sent. */}
                <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                    {normalizedEmail.charAt(0).toUpperCase() || '?'}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-[13px] font-medium">
                      {normalizedEmail}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Code sent here
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => goPane('email')}
                    disabled={disabled}
                    className="-my-2 shrink-0 py-2 text-xs font-semibold underline underline-offset-4 hover:no-underline"
                  >
                    Change
                  </button>
                </div>

                <OtpInput
                  value={code}
                  onChange={(v) => {
                    setCode(v)
                    if (error) setError('')
                  }}
                  onComplete={() => {
                    if (!expired) goPane('password')
                  }}
                  disabled={disabled || expired}
                  invalid={Boolean(error) && !expired}
                />

                {expiryRow()}

                <p className="flex items-start gap-2 border-t pt-3 text-[11.5px] leading-relaxed text-muted-foreground">
                  <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Nothing in your inbox after a minute? Check spam, or{' '}
                    <Link
                      href="/contact"
                      className="-my-1.5 inline-block py-1.5 text-foreground underline-offset-4 hover:underline"
                    >
                      contact support
                    </Link>
                    .
                  </span>
                </p>
              </>
            )}

            {pane === 'password' && (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="new-password">New password</Label>
                  <PasswordInput
                    id="new-password"
                    value={newPassword}
                    onChange={(v) => {
                      setNewPassword(v)
                      if (error) setError('')
                    }}
                    visible={showNew}
                    onToggle={() => setShowNew((v) => !v)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    disabled={disabled}
                  />
                  <PasswordStrength password={newPassword} />
                  {/* Every chip here is a server requirement, not advice —
                      they mirror isStrongPassword in lib/password-policy. */}
                  <PasswordRequirements password={newPassword} />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <PasswordInput
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(v) => {
                      setConfirmPassword(v)
                      if (error) setError('')
                    }}
                    visible={showConfirm}
                    onToggle={() => setShowConfirm((v) => !v)}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    disabled={disabled}
                  />
                  {newPassword && confirmPassword && newPassword === confirmPassword && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Passwords match
                    </p>
                  )}
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[11px] text-destructive">Passwords do not match</p>
                  )}
                </div>

                {/* The code can expire while a password is being chosen. */}
                {secondsLeft !== null && (expired || secondsLeft <= 60) && expiryRow()}
              </>
            )}

            {/* Desktop keeps the button inline; mobile uses the pinned bar. */}
            {primaryAction('mt-1 hidden w-full gap-2 lg:inline-flex')}
          </form>
        </div>
      )}
    </AuthShell>
  )
}

function MailGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  )
}
