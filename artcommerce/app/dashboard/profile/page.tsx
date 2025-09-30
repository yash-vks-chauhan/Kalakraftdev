// File: app/dashboard/profile/page.tsx

interface Address {
  id: number
  label: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: string
  createdAt: string
}

'use client'

import { useState, FormEvent, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { useIsMobile } from '../../../lib/utils'
import styles from './profile.module.css'
import MobileProfileSettings from './MobileProfileSettings'

// Profile Skeleton Component
const ProfileSkeleton = () => (
  <main className={styles.profileContainer}>
    {/* Profile Header Skeleton */}
    <div className={styles.profileHeader}>
      <div className={styles.avatarSection}>
        <div className={`${styles.skeletonAvatar} ${styles.skeletonShimmer}`}></div>
        <div className={styles.userInfo}>
          <div className={`${styles.skeletonUserName} ${styles.skeletonShimmer}`}></div>
          <div className={`${styles.skeletonUserEmail} ${styles.skeletonShimmer}`}></div>
          <div className={`${styles.skeletonUserRole} ${styles.skeletonShimmer}`}></div>
        </div>
      </div>
    </div>

    {/* Profile Form Skeleton */}
    <div className={styles.profileContent}>
      <div className={styles.profileSection}>
        <div className={`${styles.skeletonSectionTitle} ${styles.skeletonShimmer}`}></div>
        
        {/* Basic Info Form Skeleton */}
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <div className={`${styles.skeletonLabel} ${styles.skeletonShimmer}`}></div>
            <div className={`${styles.skeletonInput} ${styles.skeletonShimmer}`}></div>
          </div>
          <div className={styles.inputGroup}>
            <div className={`${styles.skeletonLabel} ${styles.skeletonShimmer}`}></div>
            <div className={`${styles.skeletonInput} ${styles.skeletonShimmer}`}></div>
          </div>
          <div className={styles.inputGroup}>
            <div className={`${styles.skeletonLabel} ${styles.skeletonShimmer}`}></div>
            <div className={`${styles.skeletonInput} ${styles.skeletonShimmer}`}></div>
          </div>
        </div>
        
        {/* Avatar Selection Skeleton */}
        <div className={styles.avatarSelection}>
          <div className={`${styles.skeletonLabel} ${styles.skeletonShimmer}`}></div>
          <div className={styles.avatarGrid}>
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className={`${styles.skeletonAvatarOption} ${styles.skeletonShimmer}`}></div>
            ))}
          </div>
        </div>
        
        {/* Save Button Skeleton */}
        <div className={`${styles.skeletonButton} ${styles.skeletonShimmer}`}></div>
      </div>

      {/* Addresses Section Skeleton */}
      <div className={styles.profileSection}>
        <div className={`${styles.skeletonSectionTitle} ${styles.skeletonShimmer}`}></div>
        
        <div className={styles.addressesList}>
          {[1, 2].map((index) => (
            <div key={index} className={styles.addressCard}>
              <div className={`${styles.skeletonAddressText} ${styles.skeletonShimmer}`}></div>
              <div className={`${styles.skeletonAddressText} ${styles.skeletonShimmer}`}></div>
              <div className={styles.addressActions}>
                <div className={`${styles.skeletonAddressButton} ${styles.skeletonShimmer}`}></div>
                <div className={`${styles.skeletonAddressButton} ${styles.skeletonShimmer}`}></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className={`${styles.skeletonButton} ${styles.skeletonShimmer}`}></div>
      </div>
    </div>
  </main>
);
import Image from 'next/image'

export default function ProfilePage() {
  const router = useRouter()
  const { user, token, logout, fetchProfile, loading: authLoading } = useAuth()
  
  const isMobile = useIsMobile()
  const [forceDesktopView, setForceDesktopView] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Core form state - MUST be declared before any conditional returns
  const [fullName, setFullName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')

  // Email‐change state
  const [newEmail, setNewEmail] = useState<string>('')
  const [emailOtp, setEmailOtp] = useState<string>('')
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [confirming, setConfirming] = useState<boolean>(false)

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Address book state ──
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addrLoading, setAddrLoading] = useState<boolean>(true)
  const [addrError, setAddrError] = useState<string|null>(null)

  // Fields for "Add new" form:
  const [newAddr, setNewAddr] = useState({
    label:       '',
    line1:       '',
    line2:       '',
    city:        '',
    postalCode:  '',
    country:     '',
  })

  // OTP timers (in seconds)
  const [emailOtpExpiresAt, setEmailOtpExpiresAt] = useState<number | null>(null)
  const [emailRemaining, setEmailRemaining] = useState<number>(0)
  const [passwordOtpExpiresAt, setPasswordOtpExpiresAt] = useState<number | null>(null);
  const [passwordRemaining, setPasswordRemaining] = useState<number>(0);

  // Change password state
  const [step, setStep] = useState<'send' | 'verify'>('send')
  const [loading, setLoading] = useState<boolean>(false)
  const [otp, setOtp] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')

  // Add state for visible orders
  const [visibleOrderCount, setVisibleOrderCount] = useState(5);
  const [showMoreLoading, setShowMoreLoading] = useState(false);

  // Add a loading state
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Memoized function to load addresses - MUST be before conditional returns
  const loadAddresses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load addresses')
      setAddresses(json.addresses)
    } catch (err: any) {
      setAddrError(err.message)
    } finally {
      setAddrLoading(false)
    }
  }, [token])

  // Format time helper function
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Memoize handlers to prevent unnecessary re-renders
  const handleProfileSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, avatarUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('Profile updated successfully')
      setFullName(data.user.fullName)
      setAvatarUrl(data.user.avatarUrl || '')
      await fetchProfile()
    } catch (err: any) {
      setError(err.message)
    }
  }, [token, fullName, avatarUrl, fetchProfile])

  const handleRequestEmailOtp = useCallback(async () => {
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/request-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOtpSent(true)
      const expires = Date.now() + 5 * 60 * 1000 // 5 minutes
      setEmailOtpExpiresAt(expires)
      setEmailRemaining(300) // 5 minutes in seconds
      setMessage('OTP sent to your current email address')
    } catch (err: any) {
      setError(err.message)
    }
  }, [token, newEmail])

  const handleConfirmEmailChange = useCallback(async () => {
    setError(null)
    setMessage(null)
    setConfirming(true)
    try {
      const res = await fetch('/api/auth/confirm-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ newEmail, otp: emailOtp }),
      })
      const data = await res.json()
      setConfirming(false)
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change email')
      }
      setMessage(`Email changed successfully to ${data.user.email}`)
      setNewEmail('')
      setEmailOtp('')
      setOtpSent(false)
      setEmailOtpExpiresAt(null)
      setEmailRemaining(0)
      await fetchProfile()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }, [token, newEmail, emailOtp, fetchProfile])

  // Change password handlers - MUST be before conditional returns
  const sendOtp = useCallback(async () => {
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/request-password-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStep('verify')
      const expires = Date.now() + 5 * 60 * 1000 // 5 minutes
      setPasswordOtpExpiresAt(expires)
      setPasswordRemaining(300) // 5 minutes in seconds
      setMessage('OTP sent to your email')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  const handleVerify = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/confirm-password-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp, newPassword, confirmPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('Password updated successfully')
      setNewPassword('')
      setConfirmPassword('')
      setOtp('')
      setStep('send')
      await fetchProfile()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, otp, newPassword, confirmPassword, fetchProfile])

  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      const pref = localStorage.getItem('viewPreference')
      if (pref === 'desktop') setForceDesktopView(true)
    }
  }, [])

  // Single initialization effect with cleanup
  useEffect(() => {
    // Wait for AuthContext to finish loading before taking any action.
    if (authLoading) return;

    // Once auth is resolved, redirect if unauthenticated.
    if (!token) {
      router.replace('/auth/login');
      return;
    }

    // Auth is ready and the user is authenticated – fetch addresses once.
    (async () => {
      setIsLoading(true);
      try {
        await loadAddresses();
      } catch (error) {
        console.error('Failed to load addresses:', error);
      } finally {
        setIsLoading(false);
      }
    })();
    // We intentionally exclude fetchProfile here to avoid an endless loop caused by toggling the auth loading state.
  }, [authLoading, token, loadAddresses]);

  // Timer effect for email OTP with cleanup
  useEffect(() => {
    if (!emailOtpExpiresAt) return;
    
    let mounted = true;
    const interval = setInterval(() => {
      if (!mounted) return;
      
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((emailOtpExpiresAt - now) / 1000))
      setEmailRemaining(remaining)
      
      if (remaining === 0) {
        setOtpSent(false)
        setEmailOtpExpiresAt(null)
        setEmailOtp('')
      }
    }, 1000)

    return () => {
      mounted = false;
      clearInterval(interval)
    }
  }, [emailOtpExpiresAt])

  // Timer effect for password OTP with cleanup
  useEffect(() => {
    if (!passwordOtpExpiresAt) return;
    
    let mounted = true;
    const interval = setInterval(() => {
      if (!mounted) return;
      
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((passwordOtpExpiresAt - now) / 1000))
      setPasswordRemaining(remaining)
      
      if (remaining === 0) {
        setStep('send')
        setPasswordOtpExpiresAt(null)
        setOtp('')
        setError('OTP for password change has expired. Please request a new one.')
      }
    }, 1000)

    return () => {
      mounted = false;
      clearInterval(interval)
    }
  }, [passwordOtpExpiresAt])

  // Sync form data with user data - only when user changes
  useEffect(() => {
    if (!user || isLoading) return;
    
    setFullName(user.fullName)
    setAvatarUrl(user.avatarUrl || '')
  }, [user, isLoading])

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return <ProfileSkeleton />
  }

  const mobileView = isMobile && !forceDesktopView

  // Return mobile version if in mobile view
  if (mobileView) {
    return <MobileProfileSettings />
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (!user) return null

  return (
    <>
      <div className={`${styles.loadingContainer} ${!isLoading ? styles.hidden : ''}`}>
        <div className={styles.loader}>
          <Image 
            src="/images/loading.png" 
            alt="Loading..."
            width={60}
            height={60}
            priority
          />
        </div>
      </div>
      
      <main className={`${styles.profileContainer} ${!isLoading ? styles.visible : ''}`}>
        <h1 className={styles.title}>Profile Settings</h1>

        {message && <p className={`${styles.message} ${styles.success}`}>{message}</p>}
        {error && <p className={`${styles.message} ${styles.error}`}>{error}</p>}

        {/* ===== Name & Avatar ===== */}
        <section className={styles.section}>
          <form onSubmit={handleProfileSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="fullName" className={styles.label}>Full Name</label>
              <input 
                id="fullName" 
                type="text" 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                className={styles.input}
              />
            </div>

            <div className={styles.avatarContainer}>
              <p className={styles.label}>Avatar</p>
              <img 
                src={avatarUrl || '/avatars/robot.svg'} 
                alt="Profile avatar" 
                className={styles.avatar}
              />
            </div>

            {/* Preset Avatar Options */}
            <div className={styles.avatarOptions}>
              {[
                { name: 'Robot', path: '/avatars/robot.svg' },
                { name: 'Fox', path: '/avatars/fox.svg' },
                { name: 'Owl', path: '/avatars/owl.svg' }
              ].map(avatar => (
                <button
                  key={avatar.name}
                  type="button"
                  onClick={() => setAvatarUrl(avatar.path)}
                  className={`${styles.avatarOption} ${avatarUrl === avatar.path ? styles.selected : ''}`}
                  title={`Select ${avatar.name} avatar`}
                >
                  <img src={avatar.path} alt={avatar.name} loading="lazy" />
                </button>
              ))}
            </div>

            {/* Custom Upload Option */}
            <div>
              <p className={styles.label}>Or upload custom:</p>
              <input
                type="file"
                accept="image/*"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const form = new FormData()
                  form.append('file', file)
                  const res = await fetch('/api/uploads', { method: 'POST', body: form })
                  const { url } = await res.json()
                  setAvatarUrl(url)
                }}
                className={styles.input}
              />
            </div>

            <button type="submit" className={styles.button}>Update Profile</button>
          </form>
        </section>

        {/* ===== Security Section ===== */}
        <section className={styles.section}>
          <h2 className={styles.title}>Security</h2>
          
          {/* Current Email Display */}
          <div className={styles.securityItem}>
            <div className={styles.securityItemIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8L10.5 13.5L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.securityItemContent}>
              <div className={styles.securityItemTitle}>Email</div>
              <div className={styles.securityItemValue}>{user.email}</div>
            </div>
          </div>

          <div className={styles.securityDivider}></div>

          {/* Change Email */}
          <details className={styles.securityItem}>
            <summary className={styles.securityItemSummary}>
              <div className={styles.securityItemIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.50023C18.8978 2.10243 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.10243 21.5 2.50023C21.8978 2.89804 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.10243 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.securityItemContent}>
                <div className={styles.securityItemTitle}>Change Email</div>
                <div className={styles.securityItemSubtitle}>Update email address</div>
              </div>
              <div className={styles.securityItemArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </summary>
            <div className={styles.securityItemDetails}>
              <div className={styles.formGroup}>
                <input 
                  type="email" 
                  placeholder="New email address" 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)} 
                  className={styles.input}
                />
                <div className={styles.formGroup}>
                  <button 
                    type="button" 
                    onClick={handleRequestEmailOtp} 
                    disabled={otpSent} 
                    className={styles.button}
                  >
                    {otpSent ? 'OTP Sent' : 'Send OTP to Current Email'}
                  </button>
                  {otpSent && emailRemaining > 0 && (
                    <span className={styles.label}>
                      Expires in: {formatTime(emailRemaining)}
                    </span>
                  )}
                </div>
              </div>
              {otpSent && (
                <div className={styles.formGroup}>
                  <input 
                    type="text" 
                    placeholder="Enter OTP" 
                    value={emailOtp} 
                    onChange={e => setEmailOtp(e.target.value)} 
                    className={styles.input}
                  />
                  <button 
                    type="button" 
                    onClick={handleConfirmEmailChange} 
                    disabled={confirming} 
                    className={styles.button}
                  >
                    {confirming ? 'Verifying…' : 'Confirm Email Change'}
                  </button>
                </div>
              )}
            </div>
          </details>

          <div className={styles.securityDivider}></div>

          {/* Change Password */}
          <details className={styles.securityItem}>
            <summary className={styles.securityItemSummary}>
              <div className={styles.securityItemIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1C10.6193 1 9.5 2.11929 9.5 3.5V5H6C4.34315 5 3 6.34315 3 8V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V8C21 6.34315 19.6569 5 18 5H14.5V3.5C14.5 2.11929 13.3807 1 12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className={styles.securityItemContent}>
                <div className={styles.securityItemTitle}>Change Password</div>
                <div className={styles.securityItemSubtitle}>Update your password</div>
              </div>
              <div className={styles.securityItemArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </summary>
            <div className={styles.securityItemDetails}>
              {step === 'send' ? (
                <button
                  onClick={sendOtp}
                  disabled={loading}
                  className={styles.button}
                >
                  {loading ? 'Sending OTP…' : 'Send OTP to my email'}
                </button>
              ) : (
                <form onSubmit={handleVerify}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      OTP Code
                      <input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.toUpperCase())}
                        required
                        className={styles.input}
                      />
                    </label>
                    {passwordRemaining > 0 && (
                      <span className={styles.label}>
                        Expires in: {formatTime(passwordRemaining)}
                      </span>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      New Password
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className={styles.input}
                      />
                    </label>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Confirm Password
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={styles.input}
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.button}
                  >
                    {loading ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              )}
            </div>
          </details>
        </section>

        {/* ===== Recent Orders ===== */}
        <section className={styles.section}>
          <h2 className={styles.title}>Your Order History</h2>
          {user.orders && user.orders.length > 0 ? (
            <ul className={styles.orderList}>
              {user.orders.slice(0, visibleOrderCount).map(o => (
                <li key={o.id} className={styles.orderItem}>
                  <span>Order #{o.id}</span>
                  <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                  <div className={styles.amountStatusRow}>
                    <span>₹{(o.totalAmount).toFixed(2)}</span>
                    <span className={`${styles.orderStatus} ${styles[`orderStatus${o.status.charAt(0).toUpperCase() + o.status.slice(1)}`]}`}>
                      {o.status}
                    </span>
                  </div>
                  <Link href={`/dashboard/orders/${o.id}`} className={styles.link}>View</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyText}>You haven&apos;t placed any orders yet.</p>
          )}
          {(user.orders && user.orders.length > visibleOrderCount) && (
            <button 
              onClick={() => {
                setShowMoreLoading(true);
                setTimeout(() => {
                  setVisibleOrderCount(prev => prev + 5);
                  setShowMoreLoading(false);
                }, 500); // Simulate loading time
              }}
              className={`${styles.button} ${showMoreLoading ? styles.buttonLoading : ''}`}
              disabled={showMoreLoading}
            >
              {showMoreLoading && <span className={styles.spinner} />}
              {showMoreLoading ? 'Loading...' : 'Show More Orders'}
            </button>
          )}
        </section>

        {/* ===== Saved Addresses ===== */}
        <section className={styles.section}>
          <h2 className={styles.title}>Saved Addresses</h2>

          {addrLoading && <p className={styles.loadingText}>Loading addresses…</p>}
          {addrError && <p className={`${styles.message} ${styles.error}`}>{addrError}</p>}

          {!addrLoading && addresses.length > 0 && (
            <ul className={styles.addressList}>
              {addresses.map(a => (
                <li key={a.id} className={styles.addressItem}>
                  <div>
                    <strong>{a.label}</strong><br/>
                    {a.line1}{a.line2 && `, ${a.line2}`}<br/>
                    {a.city}, {a.postalCode}<br/>
                    {a.country}
                  </div>
                  <div className={styles.addressActions}>
                    {user.defaultAddressId === a.id ? (
                      <span className={styles.defaultBadge}>Default</span>
                    ) : (
                      <button
                        className={styles.button}
                        onClick={async () => {
                          await fetch('/api/auth/set-default-address', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ addressId: a.id }),
                          })
                          fetchProfile()
                          setAddresses(addresses.map(x =>
                            x.id === a.id ? { ...x } : x
                          ))
                        }}
                      >
                        Make Default
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this address?')) return
                        await fetch(`/api/addresses/${a.id}`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${token}` },
                        })
                        setAddresses(addresses.filter(x => x.id !== a.id))
                      }}
                      className={`${styles.button} ${styles.deleteButton}`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* ===== Add New Address ===== */}
          <form
            onSubmit={async e => {
              e.preventDefault()
              const res = await fetch('/api/addresses', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newAddr),
              })
              const json = await res.json()
              if (!res.ok) {
                alert(json.error)
              } else {
                setAddresses([json.address, ...addresses])
                setNewAddr({ label:'', line1:'', line2:'', city:'', postalCode:'', country:'' })
              }
            }}
            className={styles.addressForm}
          >
            <h3 className={styles.title}>Add New Address</h3>
            {['label','line1','line2','city','postalCode','country'].map((field) => (
              <input
                key={field}
                type="text"
                placeholder={field[0].toUpperCase() + field.slice(1)}
                value={(newAddr as any)[field]}
                onChange={e => setNewAddr({ ...newAddr, [field]: e.target.value })}
                className={styles.input}
              />
            ))}
            <button type="submit" className={styles.button}>
              Save Address
            </button>
          </form>
        </section>
      </main>
    </>
  )
}