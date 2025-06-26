// File: app/auth/login/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext'
import Link from 'next/link'
import styles from '../auth.module.css'

export default function LoginPage() {
  const router = useRouter()
  const { user: authUser, login, loading: authLoading, loginWithFirebaseToken } = useAuth()
  const { user: firebaseUser, loading: firebaseLoading, loginWithGoogle, loginWithFacebook } = useFirebaseAuth()

  console.log('LoginPage: authLoading', authLoading)
  console.log('LoginPage: firebaseLoading', firebaseLoading)
  console.log('LoginPage: authUser', authUser)
  console.log('LoginPage: firebaseUser', firebaseUser)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only redirect if authUser (from our backend) is present and loading is complete.
    // FirebaseUser being present here means a Firebase session exists, but not necessarily a backend session.
    if (!authLoading && authUser) {
      console.log('LoginPage: authUser present and not loading, redirecting to / ', authUser);
      router.replace('/')
    }
  }, [authUser, authLoading, router])

  // Temporarily comment out the loading message to ensure the page renders
  // if (authLoading || firebaseLoading) {
  //   return <p>Loading authentication...</p>
  // }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // Prevent the default form submission
    if (formLoading) return // Prevent multiple submissions

    setError(null)
    setFormLoading(true)

    try {
      const result = await login(email, password)
      if (result && result.success) {
        console.log('Login successful, redirecting to home page')
        router.push('/')
      }
    } catch (err: any) {
      setPassword('') // Clear password field but keep email for retry
      setError(err.message || 'An error occurred during login')
      // Prevent form submission and page refresh
      e.stopPropagation()
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Welcome back</h1>
          <p className={styles.authSubtitle}>Please enter your details to sign in</p>
        </div>

        {error && (
          <div className={styles.errorMessage} role="alert">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className={styles.errorIcon}
              style={{ width: '20px', height: '20px', marginRight: '8px' }}
            >
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
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
              disabled={formLoading}
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
              placeholder="Enter your password"
              disabled={formLoading}
            />
            <Link href="/auth/forgot-password" className={styles.forgotPassword}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className={styles.submitButton}
          >
            {formLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>Or continue with</span>
        </div>

        <button
          onClick={async () => {
            setFormLoading(true);
            setError(null);
            console.log('LoginPage: Attempting Google Sign-In...');
            try {
              const result = await loginWithGoogle();
              console.log('LoginPage: loginWithGoogle result:', result);
              if (result && result.user) {
                console.log('LoginPage: Result and user present, getting ID token...');
                const idToken = await result.user.getIdToken();
                console.log('Firebase ID Token:', idToken);
                await loginWithFirebaseToken(idToken);
                console.log('LoginPage: loginWithFirebaseToken called.');
              } else {
                console.error('LoginPage: Google Sign-In failed or no user data in result.', result);
                throw new Error('Google Sign-In failed or no user data.');
              }
            } catch (err: any) {
              console.error('LoginPage: Google Sign-In caught error:', err);
              // Handle specific Firebase errors
              if (err.code === 'auth/cancelled-popup-request' || 
                  err.code === 'auth/popup-closed-by-user') {
                setError('Sign-in was cancelled. Please try again.');
              } else if (err.code === 'auth/popup-blocked') {
                setError('Pop-up was blocked by your browser. Please enable pop-ups for this site.');
              } else {
                setError(err.message || 'Google Sign-In failed. Please try again.');
              }
            } finally {
              setFormLoading(false);
            }
          }}
          disabled={formLoading}
          className={`${styles.socialButton} ${formLoading ? styles.loading : ''}`}
        >
          {formLoading ? (
            <div className={styles.buttonContent}>
              <div className={styles.spinner}></div>
              <span>Signing in...</span>
            </div>
          ) : (
            <>
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
              Sign in with Google
            </>
          )}
        </button>

        <button
          onClick={async () => {
            setFormLoading(true);
            setError(null);
            console.log('LoginPage: Attempting Facebook Sign-In...');
            try {
              const result = await loginWithFacebook();
              console.log('LoginPage: loginWithFacebook result:', result);
              if (result && result.user) {
                console.log('LoginPage: Result and user present, getting ID token...');
                const idToken = await result.user.getIdToken();
                console.log('Firebase ID Token:', idToken);
                await loginWithFirebaseToken(idToken);
                console.log('LoginPage: loginWithFirebaseToken called.');
              } else {
                console.error('LoginPage: Facebook Sign-In failed or no user data in result.', result);
                throw new Error('Facebook Sign-In failed or no user data.');
              }
            } catch (err: any) {
              console.error('LoginPage: Facebook Sign-In caught error:', err);
              setError(err.message || 'Facebook Sign-In failed');
              setFormLoading(false);
            }
          }}
          className={styles.socialButton}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Sign in with Facebook
        </button>

        <div className={styles.authFooter}>
          Don't have an account?{' '}
          <Link href="/auth/signup" className={styles.authLink}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}