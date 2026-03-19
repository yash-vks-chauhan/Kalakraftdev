import Link from 'next/link'
import ForgotPasswordShell from '../ForgotPasswordShell'
import styles from '../../auth.module.css'

export default async function ForgotPasswordSentPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email = '' } = await searchParams
  const normalizedEmail = email.trim().toLowerCase()

  return (
    <ForgotPasswordShell
      currentStep={2}
      title="Check your inbox"
      subtitle="The next step is ready. Use the verification code from your email to finish the reset."
      footer={
        <>
          Need to start over?{' '}
          <Link
            href={`/auth/forgot-password${normalizedEmail ? `?email=${encodeURIComponent(normalizedEmail)}` : ''}`}
            className={styles.authLink}
          >
            Request another code
          </Link>
        </>
      }
    >
      <div className={styles.successMessage}>
        If an account exists for <strong>{normalizedEmail || 'that email address'}</strong>, a reset
        code is on the way now.
      </div>

      <div className={styles.sequenceCard}>
        <div className={styles.sequenceTitle}>Keep this flow moving</div>
        <p className={styles.sequenceText}>
          Codes expire after five minutes, so the cleanest path is to jump straight into
          verification while the message is fresh in your inbox.
        </p>
        <div className={styles.inlineActions}>
          <Link
            href={`/auth/forgot-password/verify${normalizedEmail ? `?email=${encodeURIComponent(normalizedEmail)}` : ''}`}
            className={styles.submitButtonLink}
          >
            Enter reset code
          </Link>
          <Link href="/auth/login" className={styles.ghostLink}>
            Back to sign in
          </Link>
        </div>
      </div>
    </ForgotPasswordShell>
  )
}
