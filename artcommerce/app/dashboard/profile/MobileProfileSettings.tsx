'use client'

import { useState, FormEvent, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '../../contexts/AuthContext'
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Mail, 
  Edit, 
  Package, 
  MapPin, 
  Plus,
  Settings,
  Shield,
  Activity,
  LogOut,
  X
} from 'lucide-react'
import styles from './mobile-profile.module.css'
import InlineLoader from '../../components/InlineLoader'
import MobileBottomNavbar from '../../components/MobileBottomNavbar'
import RocketLoader from '../../components/RocketLoader'

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

export default function MobileProfileSettings() {
  const router = useRouter()
  const { user, token, logout, fetchProfile, loading: authLoading } = useAuth()

  // Core form state
  const [fullName, setFullName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')

    // Email and Password form state
  const [newEmail, setNewEmail] = useState<string>('')
  const [emailOtp, setEmailOtp] = useState<string>('')
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [emailStep, setEmailStep] = useState<'send' | 'verify'>('send')
  const [confirming, setConfirming] = useState<boolean>(false)

  // Password change state
  const [step, setStep] = useState<'send' | 'verify'>('send')
  const [loading, setLoading] = useState<boolean>(false)
  const [otp, setOtp] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')

  // UI state
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showEmailChange, setShowEmailChange] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [isPasswordModalClosing, setIsPasswordModalClosing] = useState(false)
  const [isEmailModalClosing, setIsEmailModalClosing] = useState(false)
  
  // Modal-specific message states
  const [modalMessage, setModalMessage] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [emailModalMessage, setEmailModalMessage] = useState<string | null>(null)
  const [emailModalError, setEmailModalError] = useState<string | null>(null)
  
  // Step transition states
  const [isStepTransitioning, setIsStepTransitioning] = useState(false)
  const [isEmailStepTransitioning, setIsEmailStepTransitioning] = useState(false)
  
  const [showOrders, setShowOrders] = useState(false)
  const [showAddresses, setShowAddresses] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [showAvatarSelection, setShowAvatarSelection] = useState(false)

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addrLoading, setAddrLoading] = useState<boolean>(true)
  const [addrError, setAddrError] = useState<string|null>(null)
  const [newAddr, setNewAddr] = useState({
    label: '',
    line1: '',
    line2: '',
    city: '',
    postalCode: '',
    country: '',
  })

  // OTP timers
  const [emailOtpExpiresAt, setEmailOtpExpiresAt] = useState<number | null>(null)
  const [emailRemaining, setEmailRemaining] = useState<number>(0)
  const [passwordOtpExpiresAt, setPasswordOtpExpiresAt] = useState<number | null>(null)
  const [passwordRemaining, setPasswordRemaining] = useState<number>(0)

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isMounted, setIsMounted] = useState<boolean>(false)

  // Load addresses
  const loadAddresses = useCallback(async () => {
    if (!token) return
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

  // Handle mounting
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize data
  useEffect(() => {
    if (!isMounted) return
    if (authLoading) return
    if (!token) {
      router.replace('/auth/login')
      return
    }

    const initializeData = async () => {
      setIsLoading(true)
      try {
        await loadAddresses()
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [isMounted, authLoading, token, loadAddresses, router])

  // Sync form data with user data
  useEffect(() => {
    if (!isMounted || !user || isLoading) return
    setFullName(user.fullName)
    setAvatarUrl(user.avatarUrl || '')
  }, [isMounted, user, isLoading])

  // Timer effects
  useEffect(() => {
    if (!isMounted || !emailOtpExpiresAt) return
    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((emailOtpExpiresAt - now) / 1000))
      setEmailRemaining(remaining)
      if (remaining === 0) {
        setOtpSent(false)
        setEmailOtpExpiresAt(null)
        setEmailOtp('')
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isMounted, emailOtpExpiresAt])

  useEffect(() => {
    if (!isMounted || !passwordOtpExpiresAt) return
    const interval = setInterval(() => {
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
    return () => clearInterval(interval)
  }, [isMounted, passwordOtpExpiresAt])

  // Helper functions
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Get first product image from order
  const getOrderImage = (order: any) => {
    if (order.orderItems && order.orderItems.length > 0) {
      const firstItem = order.orderItems[0]
      if (firstItem.product && firstItem.product.imageUrls) {
        try {
          const urls = Array.isArray(firstItem.product.imageUrls) 
            ? firstItem.product.imageUrls 
            : JSON.parse(firstItem.product.imageUrls || '[]')
          return urls.length > 0 ? urls[0] : null
        } catch {
          return null
        }
      }
    }
    return null
  }

  // Get order display info
  const getOrderDisplayInfo = (order: any) => {
    if (order.orderItems && order.orderItems.length > 0) {
      const itemCount = order.orderItems.length
      if (itemCount === 1) {
        return order.orderItems[0].product?.name || 'Product'
      } else {
        return `${order.orderItems[0].product?.name || 'Product'} +${itemCount - 1} more`
      }
    }
    return `Order #${order.id.toString().substring(0, 8)}`
  }

  // Handle modal close with animation
  const handlePasswordModalClose = () => {
    setIsPasswordModalClosing(true)
    setTimeout(() => {
      setShowPasswordChange(false)
      setIsPasswordModalClosing(false)
      // Reset form state when modal closes
      setStep('send')
      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
      // Reset modal-specific messages
      setModalMessage(null)
      setModalError(null)
      // Reset transition state
      setIsStepTransitioning(false)
    }, 400) // Match the CSS animation duration
  }

  // Handle email modal close with animation
  const handleEmailModalClose = () => {
    setIsEmailModalClosing(true)
    setTimeout(() => {
      setShowEmailChange(false)
      setIsEmailModalClosing(false)
      // Reset form state when modal closes
      setEmailStep('send')
      setEmailOtp('')
      setNewEmail('')
      setOtpSent(false)
      setEmailOtpExpiresAt(null)
      // Reset modal-specific messages
      setEmailModalMessage(null)
      setEmailModalError(null)
      // Reset transition state
      setIsEmailStepTransitioning(false)
    }, 400) // Match the CSS animation duration
  }

  const getStatusClass = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'statusCompleted'
      case 'processing':
      case 'confirmed':
        return 'statusProcessing'
      case 'shipped':
      case 'out_for_delivery':
        return 'statusShipped'
      case 'cancelled':
      case 'refunded':
        return 'statusCancelled'
      default:
        return 'statusPending'
    }
  }

  // Handler functions
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
      await fetchProfile()
    } catch (err: any) {
      setError(err.message)
    }
  }, [token, fullName, avatarUrl, fetchProfile])

  const handleRequestEmailOtp = useCallback(async () => {
    setEmailModalError(null)
    setEmailModalMessage(null)
    setLoading(true)
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
      
      // Smooth transition to verify step
      setIsEmailStepTransitioning(true)
      setTimeout(() => {
        setEmailStep('verify')
        setOtpSent(true)
        const expires = Date.now() + 5 * 60 * 1000
        setEmailOtpExpiresAt(expires)
        setEmailRemaining(300)
        setEmailModalMessage('OTP sent to your current email address')
        setIsEmailStepTransitioning(false)
      }, 300) // Wait for exit animation
      
    } catch (err: any) {
      setEmailModalError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, newEmail])

  const handleConfirmEmailChange = useCallback(async () => {
    setEmailModalError(null)
    setEmailModalMessage(null)
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
      if (!res.ok) throw new Error(data.error || 'Failed to change email')
      setEmailModalMessage(`Email changed successfully to ${data.user.email}`)
      setNewEmail('')
      setEmailOtp('')
      setOtpSent(false)
      setEmailOtpExpiresAt(null)
      setEmailRemaining(0)
      setEmailStep('send')
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        handleEmailModalClose()
      }, 1500)
      await fetchProfile()
    } catch (err: any) {
      setEmailModalError(err.message)
    } finally {
      setConfirming(false)
    }
  }, [token, newEmail, emailOtp, fetchProfile])

  const sendPasswordOtp = async () => {
    setModalError(null)
    setModalMessage(null)
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
      
      // Smooth transition to verify step
      setIsStepTransitioning(true)
      setTimeout(() => {
        setStep('verify')
        const expires = Date.now() + 5 * 60 * 1000
        setPasswordOtpExpiresAt(expires)
        setPasswordRemaining(300)
        setModalMessage('OTP sent to your email')
        setIsStepTransitioning(false)
      }, 300) // Wait for exit animation
      
    } catch (err: any) {
      setModalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPassword = async (e: FormEvent) => {
    e.preventDefault()
    setModalError(null)
    setModalMessage(null)
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
      setModalMessage('Password updated successfully')
      setNewPassword('')
      setConfirmPassword('')
      setOtp('')
      setStep('send')
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        handlePasswordModalClose()
      }, 1500)
      await fetchProfile()
    } catch (err: any) {
      setModalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className={styles.mobileProfileContainer}>
        <div className={styles.pageHeader}>
          <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <h1 className={styles.pageTitle}>Profile Settings</h1>
          <div className={styles.headerSpacer}></div>
        </div>
        
        <div className={styles.loadingContainer}>
          <InlineLoader size="small" message="Loading profile..." />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className={styles.mobileProfileContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className={styles.pageTitle}>Profile Settings</h1>
        <div className={styles.headerSpacer}></div>
      </div>

      <div className={styles.contentWrapper}>
        {message && <div className={`${styles.message} ${styles.success}`}>{message}</div>}
        {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}

        {/* Personal Section */}
        <div className={styles.iosSection}>
          <div className={styles.iosSectionHeader}>
            <h3 className={styles.iosSectionTitle}>Personal</h3>
          </div>
          <div className={styles.iosMenuGroup}>
            {/* Avatar Selection */}
            <div 
              className={styles.iosMenuItem}
              onClick={() => setShowAvatarSelection(prev => !prev)}
            >
              <div className={styles.iosMenuIcon}>
                {avatarUrl ? (
                  <img src={avatarUrl} className={styles.avatarPreview} alt="Avatar" />
                ) : (
                  <User size={22} />
                )}
              </div>
              <div className={styles.iosMenuContent}>
                <span className={styles.iosMenuTitle}>Profile Picture</span>
                <span className={styles.iosMenuSubtitle}>Tap to change avatar</span>
              </div>
              <ChevronRight size={16} className={styles.iosChevron} />
            </div>

            {/* Avatar Selection Expandable */}
            <div className={`${styles.expandableContent} ${showAvatarSelection ? styles.expanded : ''}`}>
              <div className={styles.avatarSelectionContent}>
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
                    >
                      <img src={avatar.path} alt={avatar.name} />
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleProfileSubmit}
                  className={styles.saveButton}
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* Name Field */}
            <div className={styles.iosMenuItem}>
              <div className={styles.iosMenuIcon}>
                <User size={22} />
              </div>
              <div className={styles.iosMenuContent}>
                <span className={styles.iosMenuTitle}>Full Name</span>
                <input 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)}
                  className={styles.inlineInput}
                  onBlur={handleProfileSubmit}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className={styles.iosSection}>
          <div className={styles.iosSectionHeader}>
            <h3 className={styles.iosSectionTitle}>Security</h3>
          </div>
          <div className={styles.iosMenuGroup}>
            {/* Email Display */}
            <div className={styles.iosMenuItem}>
              <div className={styles.iosMenuIcon}>
                <Mail size={22} />
              </div>
              <div className={styles.iosMenuContent}>
                <span className={styles.iosMenuTitle}>Email</span>
                <span className={styles.iosMenuSubtitle}>{user.email}</span>
              </div>
            </div>

            {/* Change Email Button */}
            <button 
              className={styles.iosMenuItem}
              onClick={() => setShowEmailChange(true)}
            >
              <div className={styles.iosMenuIcon}>
                <Edit size={22} />
              </div>
              <div className={styles.iosMenuContent}>
                <span className={styles.iosMenuTitle}>Change Email</span>
                <span className={styles.iosMenuSubtitle}>Update email address</span>
              </div>
              <ChevronRight size={14} className={styles.iosChevron} />
            </button>

            {/* Change Password Button */}
            <div 
              className={styles.iosMenuItem}
              onClick={() => setShowPasswordChange(true)}
            >
              <div className={styles.iosMenuIcon}>
                <Shield size={18} />
              </div>
              <div className={styles.iosMenuContent}>
                <span className={styles.iosMenuTitle}>Change Password</span>
                <span className={styles.iosMenuSubtitle}>Update your password</span>
              </div>
              <ChevronRight size={14} className={styles.iosChevron} />
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className={styles.iosSection}>
          <div className={styles.iosSectionHeader}>
            <h3 className={styles.iosSectionTitle}>Activity</h3>
          </div>
          <div className={styles.iosMenuGroup}>
            <div 
              className={styles.activityHeader}
              onClick={() => setShowOrders(prev => !prev)}
            >
              <h2 className={styles.sectionTitle}>Recent Orders</h2>
              <div className={styles.activityHeaderRight}>
                <Link href="/dashboard/orders" className={styles.viewAllLink}>
                  View All
                </Link>
                <ChevronRight size={16} className={`${styles.chevronIcon} ${showOrders ? styles.chevronRotated : ''}`} />
              </div>
            </div>
            <div className={`${styles.expandableContent} ${showOrders ? styles.expanded : ''}`}>
              {user.orders && user.orders.length > 0 ? (
                <div className={styles.iosOrdersList}>
                  {user.orders.slice(0, 3).map(order => {
                    const orderImage = getOrderImage(order)
                    const orderTitle = getOrderDisplayInfo(order)
                    
                    return (
                      <Link key={order.id} href={`/dashboard/orders/${order.id}`} className={styles.iosOrderItem}>
                        <div className={styles.orderIcon}>
                          {orderImage ? (
                            <Image
                              src={orderImage}
                              alt={orderTitle}
                              width={60}
                              height={60}
                              className={styles.orderImage}
                              priority={false}
                            />
                          ) : (
                            <Package size={20} />
                          )}
                        </div>
                        <div className={styles.orderDetails}>
                          <h4 className={styles.orderTitle}>{orderTitle}</h4>
                          <p className={styles.orderSubtitle}>{formatDate(order.createdAt)}</p>
                          <div className={styles.orderMeta}>
                            <span className={styles.orderPrice}>₹{order.totalAmount?.toFixed(0) || '0'}</span>
                            <div className={`${styles.orderStatus} ${styles[getStatusClass(order.status)]}`}>
                              <span className={styles.statusDot}></span>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className={styles.emptyStateSmall}>
                  <p className={styles.emptyText}>No recent orders</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Addresses Section */}
        <div className={styles.iosSection}>
          <div className={styles.iosSectionHeader}>
            <h3 className={styles.iosSectionTitle}>Addresses</h3>
          </div>
          <div className={styles.iosMenuGroup}>
            <div 
              className={styles.activityHeader}
              onClick={() => setShowAddresses(prev => !prev)}
            >
              <h2 className={styles.sectionTitle}>Saved Addresses</h2>
              <div className={styles.activityHeaderRight}>
                <ChevronRight size={16} className={`${styles.chevronIcon} ${showAddresses ? styles.chevronRotated : ''}`} />
              </div>
            </div>
            <div className={`${styles.expandableContent} ${showAddresses ? styles.expanded : ''}`}>
              {addrLoading ? (
                <div className={styles.loadingContainer}>
                  <InlineLoader size="small" message="Loading addresses..." />
                </div>
              ) : addresses.length > 0 ? (
                <div className={styles.addressesList}>
                  {addresses.map(address => (
                    <div key={address.id} className={styles.iosMenuItem}>
                      <div className={styles.iosMenuIcon}>
                        <MapPin size={22} />
                      </div>
                      <div className={styles.iosMenuContent}>
                        <span className={styles.iosMenuTitle}>{address.label}</span>
                        <span className={styles.iosMenuSubtitle}>
                          {address.line1}, {address.city}
                        </span>
                      </div>
                      <div className={styles.addressActions}>
                        {user.defaultAddressId === address.id && (
                          <span className={styles.defaultBadge}>Default</span>
                        )}
                        <button
                          onClick={async () => {
                            if (!confirm('Delete this address?')) return
                            await fetch(`/api/addresses/${address.id}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${token}` },
                            })
                            setAddresses(addresses.filter(x => x.id !== address.id))
                          }}
                          className={styles.deleteAddressButton}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyStateSmall}>
                  <p className={styles.emptyText}>No saved addresses</p>
                </div>
              )}
            </div>

            {/* Add New Address */}
            <div 
              className={`${styles.adminAccordionHeader} ${showAddAddress ? styles.expanded : ''}`}
              onClick={() => setShowAddAddress(prev => !prev)}
            >
              <div className={styles.adminAccordionIcon}>
                <Plus size={18} />
              </div>
              <div className={styles.adminAccordionContent}>
                <span className={styles.adminAccordionTitle}>Add New Address</span>
                <span className={styles.adminAccordionSubtitle}>Create new delivery address</span>
              </div>
              <ChevronRight size={14} className={`${styles.iosChevron} ${showAddAddress ? styles.chevronRotated : ''}`} />
            </div>

            <div className={`${styles.adminExpandableContent} ${showAddAddress ? styles.expanded : ''}`}>
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
                    setShowAddAddress(false)
                    setMessage('Address added successfully')
                  }
                }}
                className={styles.addressForm}
              >
                {['label','line1','line2','city','postalCode','country'].map((field) => (
                  <input
                    key={field}
                    type="text"
                    placeholder={field[0].toUpperCase() + field.slice(1)}
                    value={(newAddr as any)[field]}
                    onChange={e => setNewAddr({ ...newAddr, [field]: e.target.value })}
                    className={styles.formInput}
                  />
                ))}
                <button type="submit" className={styles.saveButton}>
                  Save Address
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className={styles.iosSection}>
          <div className={styles.iosMenuGroup}>
            <button 
              onClick={handleLogout}
              className={styles.logoutMenuItem}
            >
              <div className={styles.iosMenuIcon}>
                <LogOut size={22} />
              </div>
              <div className={styles.iosMenuContent}>
                <span className={styles.iosMenuTitle}>Sign Out</span>
                <span className={styles.iosMenuSubtitle}>Sign out of your account</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <>
          {/* Modal Backdrop */}
          <div 
            className={`${styles.modalBackdrop} ${isPasswordModalClosing ? styles.closing : ''}`}
            onClick={handlePasswordModalClose}
          />
          
          {/* Modal Content */}
          <div className={`${styles.passwordModal} ${isPasswordModalClosing ? styles.closing : ''}`}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHandle}></div>
              <h3 className={styles.modalTitle}>Change Password</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={handlePasswordModalClose}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalContent}>
              {/* Modal Messages */}
              {modalMessage && <div className={`${styles.message} ${styles.success}`}>{modalMessage}</div>}
              {modalError && <div className={`${styles.message} ${styles.error}`}>{modalError}</div>}
              
              <div className={styles.changePasswordForm}>
                {!isStepTransitioning && step === 'send' && (
                  <div className={`${styles.stepContent} ${styles.otpStep}`}>
                    <p className={styles.stepDescription}>
                      We'll send an OTP to your email address to verify your identity before changing your password.
                    </p>
                    <button
                      onClick={sendPasswordOtp}
                      disabled={loading}
                      className={styles.otpButton}
                    >
                      {loading ? <RocketLoader /> : 'Send OTP to Email'}
                    </button>
                  </div>
                )}
                
                {!isStepTransitioning && step === 'verify' && (
                  <div className={styles.stepContent}>
                    <form onSubmit={handleVerifyPassword}>
                    <div className={styles.inputGroup}>
                      <div className={styles.floatingInputContainer}>
                        <input
                          type="text"
                          placeholder="Enter the 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.toUpperCase())}
                          required
                          className={styles.floatingInput}
                          maxLength={6}
                          id="passwordOtpInput"
                          data-filled={otp ? "true" : "false"}
                        />
                        <label htmlFor="passwordOtpInput" className={styles.floatingLabel}>
                          Enter OTP
                        </label>
                      </div>
                      {passwordRemaining > 0 && (
                        <span className={styles.timerText}>
                          Expires in: {formatTime(passwordRemaining)}
                        </span>
                      )}
                    </div>
                    
                    <div className={styles.inputGroup}>
                      <div className={styles.floatingInputContainer}>
                        <input
                          type="password"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className={styles.floatingInput}
                          minLength={8}
                          id="newPasswordInput"
                          data-filled={newPassword ? "true" : "false"}
                        />
                        <label htmlFor="newPasswordInput" className={styles.floatingLabel}>
                          New Password
                        </label>
                      </div>
                    </div>
                    
                    <div className={styles.inputGroup}>
                      <div className={styles.floatingInputContainer}>
                        <input
                          type="password"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className={styles.floatingInput}
                          minLength={8}
                          id="confirmPasswordInput"
                          data-filled={confirmPassword ? "true" : "false"}
                        />
                        <label htmlFor="confirmPasswordInput" className={styles.floatingLabel}>
                          Confirm Password
                        </label>
                      </div>
                    </div>
                    
                    <div className={styles.modalButtons}>
                      <button
                        type="button"
                        onClick={handlePasswordModalClose}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className={styles.confirmButton}
                      >
                        {loading ? 'Updating…' : 'Update Password'}
                      </button>
                    </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Email Change Modal */}
      {showEmailChange && (
        <>
          {/* Modal Backdrop */}
          <div 
            className={`${styles.modalBackdrop} ${isEmailModalClosing ? styles.closing : ''}`}
            onClick={handleEmailModalClose}
          />
          
          {/* Modal Content */}
          <div className={`${styles.passwordModal} ${isEmailModalClosing ? styles.closing : ''}`}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHandle}></div>
              <h3 className={styles.modalTitle}>Change Email</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={handleEmailModalClose}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalContent}>
              {/* Modal Messages */}
              {emailModalMessage && <div className={`${styles.message} ${styles.success}`}>{emailModalMessage}</div>}
              {emailModalError && <div className={`${styles.message} ${styles.error}`}>{emailModalError}</div>}
              
              <div className={styles.changePasswordForm}>
                {!isEmailStepTransitioning && emailStep === 'send' && (
                  <div className={`${styles.stepContent} ${styles.otpStep}`}>
                    <p className={styles.stepDescription}>
                      Enter your new email address. We'll send an OTP to your current email to verify the change.
                    </p>
                    <div className={styles.inputGroup}>
                      <div className={styles.floatingInputContainer}>
                        <input
                          type="email"
                          placeholder="Enter new email address"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          required
                          className={styles.floatingInput}
                          id="newEmailInput"
                          data-filled={newEmail ? "true" : "false"}
                        />
                        <label htmlFor="newEmailInput" className={styles.floatingLabel}>
                          New Email Address
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={handleRequestEmailOtp}
                      disabled={loading || !newEmail}
                      className={styles.otpButton}
                    >
                      {loading ? <RocketLoader /> : 'Send OTP to Current Email'}
                    </button>
                  </div>
                )}
                
                {!isEmailStepTransitioning && emailStep === 'verify' && (
                  <div className={styles.stepContent}>
                    <form onSubmit={(e) => { e.preventDefault(); handleConfirmEmailChange(); }}>
                      <div className={styles.inputGroup}>
                        <div className={styles.floatingInputContainer}>
                          <input
                            type="text"
                            placeholder="Enter the 6-digit OTP"
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value.toUpperCase())}
                            required
                            className={styles.floatingInput}
                            maxLength={6}
                            id="emailOtpInput"
                            data-filled={emailOtp ? "true" : "false"}
                          />
                          <label htmlFor="emailOtpInput" className={styles.floatingLabel}>
                            Enter OTP
                          </label>
                        </div>
                        {emailRemaining > 0 && (
                          <span className={styles.timerText}>
                            Expires in: {formatTime(emailRemaining)}
                          </span>
                        )}
                      </div>
                      
                      <div className={styles.inputGroup}>
                        <div className={styles.floatingInputContainer}>
                          <input
                            type="email"
                            placeholder="Confirm new email address"
                            value={newEmail}
                            disabled
                            className={styles.floatingInput}
                            id="confirmEmailInput"
                            data-filled={newEmail ? "true" : "false"}
                          />
                          <label htmlFor="confirmEmailInput" className={styles.floatingLabel}>
                            Confirm New Email
                          </label>
                        </div>
                      </div>
                      
                      <div className={styles.modalButtons}>
                        <button
                          type="button"
                          onClick={handleEmailModalClose}
                          className={styles.cancelButton}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={confirming}
                          className={styles.confirmButton}
                        >
                          {confirming ? 'Updating…' : 'Update Email'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavbar />
    </div>
  )
}
