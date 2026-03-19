'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ForgotPasswordShell from './ForgotPasswordShell'
import styles from '../auth.module.css'

type ResetPasswordClientProps = {
  initialCode?: string
  initialEmail?: string
}

const LOADING_MESSAGES = [
  'Verifying your reset code...',
  'Updating your password securely...',
  'Preparing sign in...',
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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingIndex, setLoadingIndex] = useState(0)

  useEffect(() => {
    if (!loading) {
      setLoadingIndex(0)
      return
    }

    const intervalId = window.setInterval(() => {
      setLoadingIndex((currentIndex) =>
        currentIndex < LOADING_MESSAGES.length - 1 ? currentIndex + 1 : currentIndex
      )
    }, 900)

    return () => window.clearInterval(intervalId)
  }, [loading])

  const loginHref = useMemo(() => {
    const params = new URLSearchParams()
    if (email.trim()) {
      params.set('email', email.trim().toLowerCase())
    }
    params.set('reset', '1')
    return `/auth/login?${params.toString()}`
  }, [email])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (!code.trim()) {
      setError('Please enter the reset code from your email.')
      return
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please complete both password fields.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords must match.')
      return
    }

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

      setSuccess('Password updated. Taking you back to sign in...')

      window.setTimeout(() => {
        router.replace(loginHref)
      }, 900)
    } catch (submitError: any) {
      setError(submitError.message || 'Failed to reset your password')
      setLoading(false)
    }
  }

  return (
    <ForgotPasswordShell
      currentStep={success ? 3 : 2}
      title={success ? 'Password updated' : 'Finish your reset'}
      subtitle={
        success
          ? 'Your account is ready for sign in again.'
          : 'Enter the code from your inbox and choose a fresh password.'
      }
      footer={
        <>
          Remembered it already?{' '}
          <Link href="/auth/login" className={styles.authLink}>
            Back to sign in
          </Link>
        </>
      }
    >
      {error ? <div className={styles.errorMessage}>{error}</div> : null}
      {success ? <div className={styles.successMessage}>{success}</div> : null}

      {!success ? (
        <>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.formGroup}>
              <label htmlFor="reset-email" className={styles.formLabel}>
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={styles.formInput}
                placeholder="Enter your account email"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="reset-code" className={styles.formLabel}>
                Reset Code
              </label>
              <input
                id="reset-code"
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                className={`${styles.formInput} ${styles.codeInput}`}
                placeholder="Enter the 6-character code"
                autoComplete="one-time-code"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="new-password" className={styles.formLabel}>
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className={styles.formInput}
                placeholder="Choose a new password"
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirm-password" className={styles.formLabel}>
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={styles.formInput}
                placeholder="Repeat your new password"
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? (
                <span className={styles.buttonContent}>
                  <span className={styles.spinner} />
                  <span>{LOADING_MESSAGES[loadingIndex]}</span>
                </span>
              ) : (
                'Reset password'
              )}
            </button>
          </form>

          <div className={styles.sequenceCard}>
            <div className={styles.sequenceTitle}>Need another code?</div>
            <p className={styles.sequenceText}>
              Reset codes expire in five minutes. If yours has timed out, request a fresh one and
              come right back here.
            </p>
            <div className={styles.inlineActions}>
              <Link
                href={`/auth/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`}
                className={styles.secondaryButtonLink}
              >
                Request a new code
              </Link>
              <Link href={loginHref} className={styles.ghostLink}>
                Return to sign in
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.sequenceCard}>
          <div className={styles.sequenceTitle}>Next step</div>
          <p className={styles.sequenceText}>
            You will be redirected to the sign-in page with your email ready to go.
          </p>
        </div>
      )}
    </ForgotPasswordShell>
  )
}
