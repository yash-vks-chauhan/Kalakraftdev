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

  // Add avatar selection state
  const [showAvatarSelection, setShowAvatarSelection] = useState<boolean>(false)

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

        {/* ===== Profile Header Card ===== */}
        <section className={styles.profileHeaderCard}>
          <div className={styles.profileHeaderContent}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                <img 
                  src={avatarUrl || '/avatars/robot.svg'} 
                  alt="Profile avatar" 
                  className={styles.profileAvatar}
                />
                <button className={styles.avatarEditButton} onClick={() => setShowAvatarSelection(!showAvatarSelection)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/>
                  </svg>
                </button>
              </div>
              <div className={styles.profileInfo}>
                <div className={styles.profileNameGroup}>
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)}
                    onBlur={handleProfileSubmit}
                    className={styles.profileNameInput}
                    placeholder="Your Full Name"
                  />
                  <span className={styles.profileRole}>
                    {user.role === 'admin' ? 'Administrator' : 'Customer'}
                  </span>
                </div>
                <div className={styles.profileEmail}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  {user.email}
                </div>
              </div>
            </div>
          </div>
          
          {/* Avatar Selection Expandable */}
          <div className={`${styles.avatarSelectionPanel} ${showAvatarSelection ? styles.expanded : ''}`}>
            <div className={styles.avatarSelectionContent}>
              <h4 className={styles.avatarSelectionTitle}>Choose Your Avatar</h4>
              <div className={styles.avatarGrid}>
                {[
                  { name: 'Robot', path: '/avatars/robot.svg' },
                  { name: 'Fox', path: '/avatars/fox.svg' },
                  { name: 'Owl', path: '/avatars/owl.svg' }
                ].map(avatar => (
                  <button
                    key={avatar.name}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(avatar.path)
                      setShowAvatarSelection(false)
                    }}
                    className={`${styles.avatarOption} ${avatarUrl === avatar.path ? styles.selected : ''}`}
                    title={`Select ${avatar.name} avatar`}
                  >
                    <img src={avatar.path} alt={avatar.name} loading="lazy" />
                    <span className={styles.avatarOptionName}>{avatar.name}</span>
                  </button>
                ))}
              </div>
              
              {/* Custom Upload Option */}
              <div className={styles.customUploadSection}>
                <label className={styles.customUploadLabel}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Upload Custom Avatar
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
                      setShowAvatarSelection(false)
                    }}
                    className={styles.hiddenFileInput}
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Security Settings ===== */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Security Settings
            </h2>
          </div>

          <div className={styles.settingsGrid}>
            {/* Current Email Display */}
            <div className={styles.settingCard}>
              <div className={styles.settingCardHeader}>
                <div className={styles.settingIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div className={styles.settingInfo}>
                  <h4 className={styles.settingTitle}>Email Address</h4>
                  <p className={styles.settingDescription}>Your primary email for login and notifications</p>
                </div>
                <span className={styles.currentValue}>{user.email}</span>
              </div>
            </div>

            {/* Change Email */}
            <div className={styles.settingCard}>
              <details className={styles.settingDetails}>
                <summary className={styles.settingCardHeader}>
                  <div className={styles.settingIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/>
                    </svg>
                  </div>
                  <div className={styles.settingInfo}>
                    <h4 className={styles.settingTitle}>Change Email</h4>
                    <p className={styles.settingDescription}>Update your email address</p>
                  </div>
                  <svg className={styles.chevronIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </summary>
                
                <div className={styles.settingCardContent}>
                  <div className={styles.formRow}>
                    <input 
                      type="email" 
                      placeholder="Enter new email address" 
                      value={newEmail} 
                      onChange={e => setNewEmail(e.target.value)} 
                      className={styles.modernInput}
                    />
                    <button 
                      type="button" 
                      onClick={handleRequestEmailOtp} 
                      disabled={otpSent || !newEmail} 
                      className={`${styles.modernButton} ${styles.primaryButton}`}
                    >
                      {otpSent ? 'OTP Sent' : 'Send OTP'}
                    </button>
                  </div>
                  
                  {otpSent && emailRemaining > 0 && (
                    <div className={styles.timerInfo}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      Expires in: {formatTime(emailRemaining)}
                    </div>
                  )}
                  
                  {otpSent && (
                    <div className={styles.formRow}>
                      <input 
                        type="text" 
                        placeholder="Enter 6-digit OTP" 
                        value={emailOtp} 
                        onChange={e => setEmailOtp(e.target.value.toUpperCase())} 
                        className={styles.modernInput}
                        maxLength={6}
                      />
                      <button 
                        type="button" 
                        onClick={handleConfirmEmailChange} 
                        disabled={confirming || !emailOtp} 
                        className={`${styles.modernButton} ${styles.successButton}`}
                      >
                        {confirming ? 'Verifying…' : 'Confirm'}
                      </button>
                    </div>
                  )}
                </div>
              </details>
            </div>

            {/* Change Password */}
            <div className={styles.settingCard}>
              <details className={styles.settingDetails}>
                <summary className={styles.settingCardHeader}>
                  <div className={styles.settingIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <circle cx="12" cy="16" r="1"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div className={styles.settingInfo}>
                    <h4 className={styles.settingTitle}>Change Password</h4>
                    <p className={styles.settingDescription}>Update your account password</p>
                  </div>
                  <svg className={styles.chevronIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </summary>
                
                <div className={styles.settingCardContent}>
                  {step === 'send' ? (
                    <div className={styles.passwordStep}>
                      <p className={styles.stepDescription}>
                        We'll send a verification code to your email address to confirm your identity.
                      </p>
                      <button
                        onClick={sendOtp}
                        disabled={loading}
                        className={`${styles.modernButton} ${styles.primaryButton} ${styles.fullWidth}`}
                      >
                        {loading ? 'Sending…' : 'Send Verification Code'}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleVerify} className={styles.passwordForm}>
                      <div className={styles.formGroup}>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.toUpperCase())}
                          required
                          className={styles.modernInput}
                          placeholder="Enter 6-digit verification code"
                          maxLength={6}
                        />
                        {passwordRemaining > 0 && (
                          <div className={styles.timerInfo}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            Expires in: {formatTime(passwordRemaining)}
                          </div>
                        )}
                      </div>
                      
                      <div className={styles.formGroup}>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className={styles.modernInput}
                          placeholder="New password (min. 8 characters)"
                          minLength={8}
                        />
                      </div>
                      
                      <div className={styles.formGroup}>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className={styles.modernInput}
                          placeholder="Confirm new password"
                          minLength={8}
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={loading}
                        className={`${styles.modernButton} ${styles.successButton} ${styles.fullWidth}`}
                      >
                        {loading ? 'Updating…' : 'Update Password'}
                      </button>
                    </form>
                  )}
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* ===== Order History ===== */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <rect x="7" y="7" width="3" height="9"/>
                <rect x="14" y="7" width="3" height="5"/>
              </svg>
              Order History
            </h2>
            <Link href="/dashboard/orders" className={styles.viewAllLink}>
              View All Orders
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </Link>
          </div>

          {user.orders && user.orders.length > 0 ? (
            <div className={styles.ordersGrid}>
              {user.orders.slice(0, visibleOrderCount).map(o => (
                <Link key={o.id} href={`/dashboard/orders/${o.id}`} className={styles.orderCard}>
                  <div className={styles.orderCardHeader}>
                    <div className={styles.orderInfo}>
                      <span className={styles.orderId}>Order #{o.id}</span>
                      <span className={styles.orderDate}>{new Date(o.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className={`${styles.orderStatus} ${styles[`orderStatus${o.status.charAt(0).toUpperCase() + o.status.slice(1)}`]}`}>
                      <span className={styles.statusDot}></span>
                      {o.status}
                    </div>
                  </div>
                  <div className={styles.orderAmount}>₹{(o.totalAmount).toFixed(2)}</div>
                  <div className={styles.orderCardFooter}>
                    <span className={styles.viewOrderText}>View Details</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9,18 15,12 9,6"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <h3>No Orders Yet</h3>
              <p>You haven't placed any orders yet. Start shopping to see your order history here.</p>
              <Link href="/products" className={`${styles.modernButton} ${styles.primaryButton}`}>
                Start Shopping
              </Link>
            </div>
          )}
          
          {(user.orders && user.orders.length > visibleOrderCount) && (
            <button 
              onClick={() => {
                setShowMoreLoading(true);
                setTimeout(() => {
                  setVisibleOrderCount(prev => prev + 5);
                  setShowMoreLoading(false);
                }, 500);
              }}
              className={`${styles.modernButton} ${styles.secondaryButton} ${styles.fullWidth} ${showMoreLoading ? styles.loading : ''}`}
              disabled={showMoreLoading}
            >
              {showMoreLoading ? (
                <>
                  <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Loading...
                </>
              ) : (
                'Show More Orders'
              )}
            </button>
          )}
        </section>

        {/* ===== Saved Addresses ===== */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Saved Addresses
            </h2>
          </div>

          {addrLoading ? (
            <div className={styles.loadingState}>
              <svg className={styles.spinner} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              <span>Loading addresses…</span>
            </div>
          ) : addrError ? (
            <div className={styles.errorState}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span>{addrError}</span>
            </div>
          ) : (
            <>
              {addresses.length > 0 ? (
                <div className={styles.addressesGrid}>
                  {addresses.map(a => (
                    <div key={a.id} className={`${styles.addressCard} ${user.defaultAddressId === a.id ? styles.defaultAddress : ''}`}>
                      <div className={styles.addressCardHeader}>
                        <h4 className={styles.addressLabel}>{a.label}</h4>
                        {user.defaultAddressId === a.id && (
                          <span className={styles.defaultBadge}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20,6 9,17 4,12"/>
                            </svg>
                            Default
                          </span>
                        )}
                      </div>
                      <div className={styles.addressDetails}>
                        <p>{a.line1}{a.line2 && `, ${a.line2}`}</p>
                        <p>{a.city}, {a.postalCode}</p>
                        <p>{a.country}</p>
                      </div>
                      <div className={styles.addressActions}>
                        {user.defaultAddressId !== a.id && (
                          <button
                            className={`${styles.modernButton} ${styles.secondaryButton} ${styles.small}`}
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
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20,6 9,17 4,12"/>
                            </svg>
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
                          className={`${styles.modernButton} ${styles.dangerButton} ${styles.small}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <h3>No Saved Addresses</h3>
                  <p>Add your first address to make checkout faster and easier.</p>
                </div>
              )}

              {/* Add New Address Form */}
              <div className={styles.addAddressSection}>
                <h3 className={styles.addAddressTitle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  Add New Address
                </h3>
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
                      setError(json.error)
                    } else {
                      setAddresses([json.address, ...addresses])
                      setNewAddr({ label:'', line1:'', line2:'', city:'', postalCode:'', country:'' })
                      setMessage('Address added successfully')
                    }
                  }}
                  className={styles.addressForm}
                >
                  <div className={styles.formGrid}>
                    <input
                      type="text"
                      placeholder="Address Label (e.g., Home, Office)"
                      value={newAddr.label}
                      onChange={e => setNewAddr({ ...newAddr, label: e.target.value })}
                      className={styles.modernInput}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      value={newAddr.line1}
                      onChange={e => setNewAddr({ ...newAddr, line1: e.target.value })}
                      className={styles.modernInput}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2 (Optional)"
                      value={newAddr.line2}
                      onChange={e => setNewAddr({ ...newAddr, line2: e.target.value })}
                      className={styles.modernInput}
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddr.city}
                      onChange={e => setNewAddr({ ...newAddr, city: e.target.value })}
                      className={styles.modernInput}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={newAddr.postalCode}
                      onChange={e => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                      className={styles.modernInput}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={newAddr.country}
                      onChange={e => setNewAddr({ ...newAddr, country: e.target.value })}
                      className={styles.modernInput}
                      required
                    />
                  </div>
                  <button type="submit" className={`${styles.modernButton} ${styles.primaryButton} ${styles.fullWidth}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    Save Address
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  )
}