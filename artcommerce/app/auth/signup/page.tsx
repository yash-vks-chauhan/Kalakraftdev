// File: app/auth/signup/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, User2, UserPlus } from 'lucide-react'

import AuthShell from '../AuthShell'
import {
  Banner,
  DividerText,
  OAuthSplash,
  PasswordInput,
  SocialButton,
  SuccessRedirect,
} from '../_components/AuthBits'
import {
  beginOAuthFlow,
  clearOAuthFlow,
  readOAuthFlow,
  type OAuthProvider,
} from '../_components/oauthFlow'
import { useAuth } from '../../contexts/AuthContext'
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Submission = 'idle' | 'email' | 'google' | 'facebook' | 'success'

interface PasswordScore {
  score: 0 | 1 | 2 | 3 | 4
  label: 'Too short' | 'Weak' | 'Fair' | 'Good' | 'Strong'
}

function scorePassword(pw: string): PasswordScore {
  if (pw.length < 8) return { score: 0, label: 'Too short' }
  let s = 1
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  const labels: PasswordScore['label'][] = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
  return { score: s as PasswordScore['score'], label: labels[s] }
}

export default function SignupPage() {
  const router = useRouter()
  const { user: authUser, signup, loading: authLoading } = useAuth()
  const {
    loginWithGoogle,
    loginWithFacebook,
    loading: firebaseLoading,
    error: firebaseError,
  } = useFirebaseAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submission, setSubmission] = useState<Submission>('idle')
  const [pendingOAuth, setPendingOAuth] = useState<OAuthProvider | null>(null)

  useEffect(() => {
    if (!authLoading && authUser) router.replace('/')
  }, [authUser, authLoading, router])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    if (emailParam) setEmail(emailParam)
    const restored = readOAuthFlow()
    if (restored) setPendingOAuth(restored)
  }, [])

  useEffect(() => {
    if (firebaseError) {
      setError(firebaseError)
      setSubmission('idle')
      setPendingOAuth(null)
      clearOAuthFlow()
    }
  }, [firebaseError])

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

  useEffect(() => {
    if (authUser && pendingOAuth) {
      setPendingOAuth(null)
      clearOAuthFlow()
    }
  }, [authUser, pendingOAuth])

  const passwordStrength = useMemo(() => scorePassword(password), [password])
  const passwordMatches =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
  const passwordMismatch =
    password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword

  const busy = submission !== 'idle' || firebaseLoading
  const disabled = busy || authLoading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) return setError('Please enter your name')
    if (!email.trim()) return setError('Please enter your email')
    if (password.length < 8)
      return setError('Password must be at least 8 characters')
    if (password !== confirmPassword)
      return setError('Passwords do not match')

    setSubmission('email')
    try {
      await signup(name.trim(), email.trim(), password)
      setSubmission('success')
      // useEffect handles redirect once authUser populates
    } catch (err: any) {
      setError(err?.message || 'Signup failed')
      setSubmission('idle')
    }
  }

  async function handleGoogle() {
    setError(null)
    setSubmission('google')
    setPendingOAuth('google')
    beginOAuthFlow('google')
    try {
      const result = await loginWithGoogle()
      if (result?.user) {
        setSubmission('success')
        clearOAuthFlow()
        router.replace('/')
      } else {
        setSubmission('idle')
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed')
      setSubmission('idle')
      setPendingOAuth(null)
      clearOAuthFlow()
    }
  }

  async function handleFacebook() {
    setError(null)
    setSubmission('facebook')
    setPendingOAuth('facebook')
    beginOAuthFlow('facebook')
    try {
      const result = await loginWithFacebook()
      if (result?.user) {
        setSubmission('success')
        clearOAuthFlow()
        router.replace('/')
      } else {
        setSubmission('idle')
      }
    } catch (err: any) {
      setError(err?.message || 'Facebook sign-in failed')
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

  return (
    <AuthShell
      eyebrow="Create account"
      title="Join Kalakraft"
      subtitle="Save favorites, track orders, and get early access to artisan drops."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      {submission === 'success' ? (
        <SuccessRedirect
          message="Account created. Setting up your shop…"
          hint="Almost there"
        />
      ) : pendingOAuth ? (
        <OAuthSplash provider={pendingOAuth} onCancel={cancelOAuth} />
      ) : (
        <div className="flex flex-col gap-5">
          {error && <Banner tone="error">{error}</Banner>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
                    if (error) setError(null)
                  }}
                  placeholder="Your name"
                  autoComplete="name"
                  disabled={disabled}
                  required
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={disabled}
                  required
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(v) => {
                  setPassword(v)
                  if (error) setError(null)
                }}
                visible={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                disabled={disabled}
              />
              <PasswordStrength password={password} strength={passwordStrength} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <PasswordInput
                id="confirm"
                value={confirmPassword}
                onChange={(v) => {
                  setConfirmPassword(v)
                  if (error) setError(null)
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

            <Button
              type="submit"
              disabled={disabled}
              className="mt-1 h-10 w-full gap-2"
            >
              {submission === 'email' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create account
                </>
              )}
            </Button>

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
          </form>

          <DividerText>or continue with</DividerText>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <SocialButton
              provider="google"
              loading={submission === 'google'}
              disabled={disabled}
              onClick={handleGoogle}
            />
            <SocialButton
              provider="facebook"
              loading={submission === 'facebook'}
              disabled={disabled}
              onClick={handleFacebook}
            />
          </div>
        </div>
      )}
    </AuthShell>
  )
}

function PasswordStrength({
  password,
  strength,
}: {
  password: string
  strength: PasswordScore
}) {
  if (!password) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Use at least 8 characters with a mix of letters, numbers and symbols.
      </p>
    )
  }
  const segments = [0, 1, 2, 3]
  const toneClass =
    strength.score <= 1
      ? 'bg-destructive'
      : strength.score === 2
      ? 'bg-amber-500'
      : strength.score === 3
      ? 'bg-sky-500'
      : 'bg-emerald-500'
  const toneText =
    strength.score <= 1
      ? 'text-destructive'
      : strength.score === 2
      ? 'text-amber-600 dark:text-amber-400'
      : strength.score === 3
      ? 'text-sky-600 dark:text-sky-400'
      : 'text-emerald-600 dark:text-emerald-400'

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {segments.map((i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i < strength.score ? toneClass : 'bg-muted'
            )}
          />
        ))}
      </div>
      <span className={cn('text-[11px] font-medium tabular-nums', toneText)}>
        {strength.label}
      </span>
    </div>
  )
}
