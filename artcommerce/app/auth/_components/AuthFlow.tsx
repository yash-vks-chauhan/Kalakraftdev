// File: app/auth/_components/AuthFlow.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, LogIn, Mail, User2, UserPlus } from 'lucide-react'

import AuthShell from '../AuthShell'
import {
  Banner,
  DividerText,
  EmailInput,
  OAuthSplash,
  PasswordInput,
  PasswordRequirements,
  PasswordStrength,
  SegmentedTabs,
  SocialButton,
  SuccessRedirect,
  TrustRow,
} from './AuthBits'
import {
  beginOAuthFlow,
  clearOAuthFlow,
  readOAuthFlow,
  type OAuthProvider,
} from './oauthFlow'
import { useAuth } from '../../contexts/AuthContext'
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type AuthTab = 'signin' | 'signup'
type Submission = 'idle' | 'email' | 'google' | 'facebook' | 'success'

const FORM_ID = 'auth-form'

const TAB_PATH: Record<AuthTab, string> = {
  signin: '/auth/login',
  signup: '/auth/signup',
}

const COPY: Record<
  AuthTab,
  {
    eyebrow: string
    title: string
    subtitle: string
    /** Shorter heading for the mobile sheet — the crown already says Kalakraft. */
    mobileTitle: string
    mobileSubtitle: string
    cta: string
    busyCta: string
  }
> = {
  signin: {
    eyebrow: 'Welcome back',
    title: 'Sign in to Kalakraft',
    subtitle: 'Pick up where you left off — orders, saved pieces and curated drops.',
    mobileTitle: 'Welcome back',
    mobileSubtitle: 'Your saved pieces and orders are waiting.',
    cta: 'Sign in',
    busyCta: 'Signing in…',
  },
  signup: {
    eyebrow: 'Create account',
    title: 'Join Kalakraft',
    subtitle: 'Save favorites, track orders, and get early access to artisan drops.',
    mobileTitle: 'Create your account',
    mobileSubtitle: 'Save favourites, track orders, get first look at drops.',
    cta: 'Create account',
    busyCta: 'Creating account…',
  },
}

export default function AuthFlow({ initialTab }: { initialTab: AuthTab }) {
  const router = useRouter()
  const { user: authUser, login, signup, loading: authLoading } = useAuth()
  const {
    loading: firebaseLoading,
    loginWithGoogle,
    loginWithFacebook,
    error: firebaseError,
  } = useFirebaseAuth()

  const [tab, setTab] = useState<AuthTab>(initialTab)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submission, setSubmission] = useState<Submission>('idle')
  // OAuth flow that may have been started before a full-page redirect to
  // Google/Facebook (mobile path). Restored from sessionStorage on mount so we
  // can render the splash immediately rather than showing a stale-looking form.
  const [pendingOAuth, setPendingOAuth] = useState<OAuthProvider | null>(null)

  useEffect(() => {
    if (!authLoading && authUser) router.replace('/')
  }, [authUser, authLoading, router])

  useEffect(() => {
    if (firebaseError) {
      setError(firebaseError)
      setSubmission('idle')
      setPendingOAuth(null)
      clearOAuthFlow()
    }
  }, [firebaseError])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    const resetParam = params.get('reset')
    if (emailParam) setEmail(emailParam)
    if (resetParam === '1') {
      setInfo('Password updated. Sign in with your new password.')
    }
    // Restore any in-flight OAuth flow (post-redirect remount).
    const restored = readOAuthFlow()
    if (restored) setPendingOAuth(restored)
  }, [])

  // Safety net: if firebase finishes loading without producing a user, the
  // restored OAuth flow must have been abandoned — drop the splash so the user
  // can try again instead of staring at a perpetual spinner.
  useEffect(() => {
    if (!pendingOAuth) return
    if (firebaseLoading) return
    if (authUser) return
    const id = window.setTimeout(() => {
      setPendingOAuth(null)
      clearOAuthFlow()
    }, 1500)
    return () => window.clearTimeout(id)
  }, [pendingOAuth, firebaseLoading, authUser])

  // Clear the persisted flag once we have a user — about to redirect anyway.
  useEffect(() => {
    if (authUser && pendingOAuth) {
      setPendingOAuth(null)
      clearOAuthFlow()
    }
  }, [authUser, pendingOAuth])

  const busy = submission !== 'idle' || firebaseLoading
  const disabled = busy || authLoading

  const passwordMatches =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
  const passwordMismatch =
    password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword

  const copy = COPY[tab]

  /**
   * Switching flows keeps this component mounted — anything already typed
   * (an email, most often) survives. The URL is kept in step without a
   * navigation so a refresh or a share lands on the right form.
   */
  const selectTab = useCallback(
    (next: string) => {
      const value = next as AuthTab
      setTab(value)
      setError('')
      setInfo('')
      const path = TAB_PATH[value]
      if (window.location.pathname !== path) {
        window.history.replaceState(null, '', path + window.location.search)
      }
    },
    []
  )

  function clearMessages() {
    if (error) setError('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (tab === 'signin') {
      if (!email.trim() || !password.trim()) {
        setError(
          !email.trim() && !password.trim()
            ? 'Please enter both email and password'
            : !email.trim()
            ? 'Please enter your email'
            : 'Please enter your password'
        )
        return
      }

      setSubmission('email')
      try {
        await login(email, password)
        setSubmission('success')
        // the redirect effect takes over once authUser is set
      } catch (err: any) {
        setError(err?.message || 'Sign-in failed. Please try again.')
        setSubmission('idle')
      }
      return
    }

    if (!name.trim()) return setError('Please enter your name')
    if (!email.trim()) return setError('Please enter your email')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirmPassword) return setError('Passwords do not match')

    setSubmission('email')
    try {
      await signup(name.trim(), email.trim(), password)
      setSubmission('success')
    } catch (err: any) {
      setError(err?.message || 'Signup failed')
      setSubmission('idle')
    }
  }

  async function runOAuth(provider: OAuthProvider) {
    setError('')
    setSubmission(provider)
    setPendingOAuth(provider)
    beginOAuthFlow(provider)
    const signIn = provider === 'google' ? loginWithGoogle : loginWithFacebook
    try {
      const result = await signIn()
      if (result?.user) {
        setSubmission('success')
        clearOAuthFlow()
        router.replace('/')
      } else {
        // No result: likely the redirect path — leave the splash up; the
        // post-redirect remount will pick it back up via sessionStorage.
        setSubmission('idle')
      }
    } catch (err: any) {
      const label = provider === 'google' ? 'Google' : 'Facebook'
      setError(err?.message || `${label} sign-in failed`)
      setSubmission('idle')
      setPendingOAuth(null)
      clearOAuthFlow()
    }
  }

  function cancelOAuth() {
    setPendingOAuth(null)
    setSubmission('idle')
    clearOAuthFlow()
  }

  const showingForm = submission !== 'success' && !pendingOAuth

  /* ── the primary action, rendered inline on desktop and inside the
        sticky bar on mobile. `form` links the sticky copy back to the form
        it submits, so it works outside the <form> element. ───────────── */
  function primaryAction(className: string) {
    return (
      <Button
        type="submit"
        form={FORM_ID}
        size="lg"
        disabled={disabled}
        className={className}
      >
        {submission === 'email' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {copy.busyCta}
          </>
        ) : (
          <>
            {tab === 'signin' ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {copy.cta}
          </>
        )}
      </Button>
    )
  }

  const socialButtons = (
    <div className="order-1 grid grid-cols-1 gap-2.5 lg:order-3 lg:grid-cols-2">
      <SocialButton
        provider="google"
        loading={submission === 'google'}
        disabled={disabled}
        onClick={() => runOAuth('google')}
      />
      <SocialButton
        provider="facebook"
        loading={submission === 'facebook'}
        disabled={disabled}
        onClick={() => runOAuth('facebook')}
      />
    </div>
  )

  return (
    <AuthShell
      mobileCrown
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.subtitle}
      tabs={
        showingForm ? (
          <SegmentedTabs
            value={tab}
            onChange={selectTab}
            // Switching panes is client-side and safe while the session is
            // still resolving; only a submission in flight locks it.
            disabled={busy}
            options={[
              { value: 'signin', label: 'Sign in', controls: 'auth-pane-signin' },
              {
                value: 'signup',
                label: 'Create account',
                controls: 'auth-pane-signup',
              },
            ]}
          />
        ) : undefined
      }
      actionBar={
        showingForm ? (
          <>
            {primaryAction('w-full gap-2')}
            <p className="text-center text-[13px] text-muted-foreground">
              {tab === 'signin' ? (
                <>
                  New to Kalakraft?{' '}
                  <button
                    type="button"
                    onClick={() => selectTab('signup')}
                    className="-my-1.5 py-1.5 font-medium text-foreground underline underline-offset-4"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => selectTab('signin')}
                    className="-my-1.5 py-1.5 font-medium text-foreground underline underline-offset-4"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </>
        ) : undefined
      }
      footer={
        tab === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        )
      }
    >
      {submission === 'success' ? (
        <SuccessRedirect
          message={
            tab === 'signin'
              ? 'Welcome back. Taking you to your account…'
              : 'Account created. Setting up your shop…'
          }
          hint={tab === 'signin' ? 'Redirecting…' : 'Almost there'}
        />
      ) : pendingOAuth ? (
        <OAuthSplash provider={pendingOAuth} onCancel={cancelOAuth} />
      ) : (
        <div
          id={`auth-pane-${tab}`}
          role="tabpanel"
          aria-label={copy.title}
          className="flex flex-col gap-5"
        >
          {/* The crown carries the brand on mobile, so the sheet only needs a
              short heading; AuthShell renders the full one from lg up. */}
          <div className="flex flex-col gap-1 lg:hidden">
            <h1 className="text-xl font-semibold tracking-tight">
              {copy.mobileTitle}
            </h1>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {copy.mobileSubtitle}
            </p>
          </div>

          {info && <Banner tone="success">{info}</Banner>}
          {error && <Banner tone="error">{error}</Banner>}

          {/* Mobile puts the providers first — that is the path most people
              take. From lg up the order is unchanged: form, divider, socials. */}
          <div className="flex flex-col gap-5">
            {socialButtons}

            <div className="order-2">
              <DividerText>
                <span className="lg:hidden">or use email</span>
                <span className="hidden lg:inline">or continue with</span>
              </DividerText>
            </div>

            <form
              id={FORM_ID}
              onSubmit={handleSubmit}
              className="order-3 flex flex-col gap-4 lg:order-1"
              noValidate
            >
              {tab === 'signup' && (
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        clearMessages()
                      }}
                      placeholder="Your name"
                      autoComplete="name"
                      disabled={disabled}
                      required
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <EmailInput
                  id="email"
                  value={email}
                  onChange={(v) => {
                    setEmail(v)
                    clearMessages()
                  }}
                  disabled={disabled}
                  leadingIcon={<Mail className="h-4 w-4" />}
                />
              </div>

              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {tab === 'signin' && (
                    <Link
                      href="/auth/forgot-password"
                      // -my-2/py-2 widens the tap target without moving the row.
                      className="-my-2 py-2 text-xs text-muted-foreground hover:text-foreground"
                      tabIndex={disabled ? -1 : 0}
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(v) => {
                    setPassword(v)
                    clearMessages()
                  }}
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  placeholder={
                    tab === 'signin'
                      ? 'Enter your password'
                      : 'At least 8 characters'
                  }
                  autoComplete={
                    tab === 'signin' ? 'current-password' : 'new-password'
                  }
                  disabled={disabled}
                />
                {tab === 'signup' && (
                  <>
                    <PasswordStrength password={password} />
                    <PasswordRequirements password={password} />
                  </>
                )}
              </div>

              {tab === 'signup' && (
                <div className="grid gap-1.5">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <PasswordInput
                    id="confirm"
                    value={confirmPassword}
                    onChange={(v) => {
                      setConfirmPassword(v)
                      clearMessages()
                    }}
                    visible={showConfirm}
                    onToggle={() => setShowConfirm((v) => !v)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    disabled={disabled}
                  />
                  {passwordMatches && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Passwords match
                    </p>
                  )}
                  {passwordMismatch && (
                    <p className="text-[11px] text-destructive">
                      Passwords do not match
                    </p>
                  )}
                </div>
              )}

              {/* Desktop keeps the button in the flow; mobile uses the pinned
                  action bar, so this copy is hidden below lg. */}
              {primaryAction('mt-1 hidden w-full gap-2 lg:inline-flex')}

              {tab === 'signup' && (
                <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                  By creating an account you agree to our{' '}
                  <Link href="/terms" className="underline-offset-4 hover:underline">
                    terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="underline-offset-4 hover:underline">
                    privacy policy
                  </Link>
                  .
                </p>
              )}
            </form>
          </div>

          {/* The proof the desktop panel shows, condensed to one line. */}
          <TrustRow className="lg:hidden" />
        </div>
      )}
    </AuthShell>
  )
}
