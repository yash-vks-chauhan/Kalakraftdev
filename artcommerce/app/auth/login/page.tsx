// File: app/auth/login/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, LogIn, Mail } from 'lucide-react'

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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Submission = 'idle' | 'email' | 'google' | 'facebook' | 'success'

export default function LoginPage() {
  const router = useRouter()
  const { user: authUser, login, loading: authLoading } = useAuth()
  const {
    loading: firebaseLoading,
    loginWithGoogle,
    loginWithFacebook,
    error: firebaseError,
  } = useFirebaseAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submission, setSubmission] = useState<Submission>('idle')
  // OAuth flow that may have been started before a full-page redirect to
  // Google/Facebook (mobile path). Restored from sessionStorage on mount so we
  // can render the splash immediately rather than showing a stale-looking form.
  const [pendingOAuth, setPendingOAuth] = useState<OAuthProvider | null>(null)

  useEffect(() => {
    if (authUser) {
      router.push('/')
    }
  }, [authUser, router])

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setInfo('')

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
      // useEffect will redirect once authUser is set
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed. Please try again.')
      setSubmission('idle')
    }
  }

  async function handleGoogle() {
    setError('')
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
        // No result: likely the redirect path — leave the splash up; the
        // post-redirect remount will pick it back up via sessionStorage.
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
    setError('')
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
      eyebrow="Welcome back"
      title="Sign in to Kalakraft"
      subtitle="Pick up where you left off — orders, saved pieces and curated drops."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      {submission === 'success' ? (
        <SuccessRedirect message="Welcome back. Taking you to your account…" />
      ) : pendingOAuth ? (
        <OAuthSplash provider={pendingOAuth} onCancel={cancelOAuth} />
      ) : (
        <div className="flex flex-col gap-5">
          {info && <Banner tone="success">{info}</Banner>}
          {error && <Banner tone="error">{error}</Banner>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
                    if (error) setError('')
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  tabIndex={disabled ? -1 : 0}
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(v) => {
                  setPassword(v)
                  if (error) setError('')
                }}
                visible={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={disabled}
              />
            </div>

            <Button
              type="submit"
              disabled={disabled}
              className="mt-1 h-10 w-full gap-2"
            >
              {submission === 'email' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
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
