// File: app/auth/signup/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext'
import Link from 'next/link'
import styles from '../auth.module.css'

export default function SignupPage() {
  const router = useRouter()
  const { user: authUser, signup, loading: authLoading, loginWithFirebaseToken } = useAuth()
  const { user: firebaseUser, loading: firebaseLoading, loginWithGoogle, loginWithFacebook } = useFirebaseAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('SignupPage: authLoading', authLoading)
  console.log('SignupPage: firebaseLoading', firebaseLoading)
  console.log('SignupPage: authUser', authUser)
  console.log('SignupPage: firebaseUser', firebaseUser)

  useEffect(() => {
    if (!authLoading && authUser) {
      router.replace('/')
    }
  }, [authUser, authLoading, router])

  // Get email from URL if redirected from login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setFormLoading(true)

    try {
      await signup(name, email, password)
    } catch (err: any) {
      setError(err.message || 'Signup failed')
      setFormLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Create an account</h1>
          <p className={styles.authSubtitle}>Please fill in your details to sign up</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.formLabel}>
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.formInput}
              placeholder="Enter your full name"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.formInput}
              placeholder="Enter your email"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.formInput}
              placeholder="Create a password"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.formLabel}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.formInput}
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className={styles.submitButton}
          >
            {formLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>Or continue with</span>
        </div>

        <button
          onClick={async () => {
            setFormLoading(true);
            setError(null);
            try {
              const result = await loginWithGoogle();
              if (result && result.user) {
                const idToken = await result.user.getIdToken();
                await loginWithFirebaseToken(idToken);
              } else {
                throw new Error('Google Sign-In failed or no user data.');
              }
            } catch (err: any) {
              setError(err.message || 'Google Sign-In failed');
              setFormLoading(false);
            }
          }}
          className={styles.socialButton}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign up with Google
        </button>

        <button
          onClick={async () => {
            setFormLoading(true);
            setError(null);
            try {
              const result = await loginWithFacebook();
              if (result && result.user) {
                const idToken = await result.user.getIdToken();
                await loginWithFirebaseToken(idToken);
              } else {
                throw new Error('Facebook Sign-In failed or no user data.');
              }
            } catch (err: any) {
              setError(err.message || 'Facebook Sign-In failed');
              setFormLoading(false);
            }
          }}
          className={styles.socialButton}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Sign up with Facebook
        </button>

        <div className={styles.authFooter}>
          Already have an account?{' '}
          <Link href="/auth/login" className={styles.authLink}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}