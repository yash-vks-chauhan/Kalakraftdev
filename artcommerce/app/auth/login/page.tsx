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
  PasswordInput,
  SocialButton,
  SuccessRedirect,
} from '../_components/AuthBits'
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

  useEffect(() => {
    if (authUser) {
      router.push('/')
    }
  }, [authUser, router])

  useEffect(() => {
    if (firebaseError) {
      setError(firebaseError)
      setSubmission('idle')
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
  }, [])

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
    try {
      const result = await loginWithGoogle()
      if (result?.user) {
        setSubmission('success')
        router.replace('/')
      } else {
        setSubmission('idle')
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed')
      setSubmission('idle')
    }
  }

  async function handleFacebook() {
    setError('')
    setSubmission('facebook')
    try {
      const result = await loginWithFacebook()
      if (result?.user) {
        setSubmission('success')
        router.replace('/')
      } else {
        setSubmission('idle')
      }
    } catch (err: any) {
      setError(err?.message || 'Facebook sign-in failed')
      setSubmission('idle')
    }
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
