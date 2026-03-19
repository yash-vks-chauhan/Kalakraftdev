'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import ForgotPasswordShell from './ForgotPasswordShell'
import styles from '../auth.module.css'

const LOADING_MESSAGES = [
  'Checking your request...',
  'Generating a secure reset code...',
  'Preparing the next step...',
]

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function ForgotPasswordRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingIndex, setLoadingIndex] = useState(0)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

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

      router.push(`/auth/forgot-password/sent?email=${encodeURIComponent(normalizedEmail)}`)
    } catch (submitError: any) {
      setError(submitError.message || 'Unable to start password reset')
      setLoading(false)
    }
  }

  return (
    <ForgotPasswordShell
      currentStep={1}
      title="Reset your password"
      subtitle="We will send a short verification code so you can create a new password securely."
      footer={
        <>
          Remember your password?{' '}
          <Link href="/auth/login" className={styles.authLink}>
            Back to sign in
          </Link>
        </>
      }
    >
      {error ? <div className={styles.errorMessage}>{error}</div> : null}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.formGroup}>
          <label htmlFor="forgot-email" className={styles.formLabel}>
            Account Email
          </label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={styles.formInput}
            placeholder="Enter your email"
            autoComplete="email"
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
            'Send reset code'
          )}
        </button>
      </form>

      <div className={styles.sequenceCard}>
        <div className={styles.sequenceTitle}>What happens next</div>
        <ol className={styles.sequenceList}>
          <li>We send a six-character code to the email you entered.</li>
          <li>You confirm the code and choose a new password.</li>
          <li>You return to sign in with the updated password.</li>
        </ol>
      </div>
    </ForgotPasswordShell>
  )
}
