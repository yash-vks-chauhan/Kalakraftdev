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
import styles from './profile.module.css'
import Image from 'next/image'

export default function ProfilePage() {
  const router = useRouter()
  const { user, token, logout, fetchProfile, loading: authLoading } = useAuth()

  // Core form state
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

  // Memoized function to load addresses
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

  // ===== Change Password =====
  async function sendOtp() {
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
  }

  async function handleVerify(e: FormEvent) {
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
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
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
    )
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
                  <img src={avatar.path} alt={avatar.name} />
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

            {/* ===== Email display & change ===== */}
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input 
                id="email" 
                type="email" 
                value={user.email} 
                readOnly 
                className={`${styles.input} ${styles.disabled}`}
              />
            </div>

            <details className={styles.section}>
              <summary className={`${styles.label} ${styles.summaryWithArrow}`}>Change Email Address</summary>
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
            </details>

            <button type="submit" className={styles.button}>Update Profile</button>
          </form>
        </section>

        {/* ===== Change Password ===== */}
        <section className={styles.section}>
          <h2 className={styles.title}>Change Password</h2>
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
        </section>

        {/* ===== Order History ===== */}
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
            <p className={styles.emptyText}>You haven't placed any orders yet.</p>
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