'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import Link from 'next/link'
import Image from 'next/image'
import styles from './mobile.module.css'
import { 
  User, 
  Package, 
  ShoppingBag, 
  Heart, 
  Settings, 
  LogOut, 
  ChevronRight,
  Ticket,
  CreditCard,
  MapPin,
  Bell,
  HelpCircle,
  Shield
} from 'lucide-react'

export default function MobileDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  if (!user) {
    router.replace('/auth/login')
    return null
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
      setLoggingOut(false)
    }
  }

  return (
    <div className={styles.mobileDashboard}>
      <div className={styles.dashboardHeader}>
        <h1>My Account</h1>
      </div>

      <div className={styles.userProfile}>
        <div className={styles.userAvatar}>
          {user.avatarUrl ? (
            <Image 
              src={user.avatarUrl} 
              alt={user.fullName || 'User'} 
              width={60} 
              height={60}
              className={styles.avatarImage}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <User size={24} />
            </div>
          )}
        </div>
        <div className={styles.userInfo}>
          <h2>{user.fullName || 'User'}</h2>
          <p>{user.email}</p>
        </div>
        <Link href="/dashboard/profile" className={styles.editProfileButton}>
          Edit
        </Link>
      </div>

      <div className={styles.dashboardSection}>
        <h3 className={styles.sectionTitle}>My Orders</h3>
        <div className={styles.orderStats}>
          <Link href="/dashboard/orders?status=processing" className={styles.orderStat}>
            <div className={styles.orderStatIcon}>
              <Package size={20} />
            </div>
            <span>Processing</span>
          </Link>
          <Link href="/dashboard/orders?status=shipped" className={styles.orderStat}>
            <div className={styles.orderStatIcon}>
              <Package size={20} />
            </div>
            <span>Shipped</span>
          </Link>
          <Link href="/dashboard/orders?status=delivered" className={styles.orderStat}>
            <div className={styles.orderStatIcon}>
              <Package size={20} />
            </div>
            <span>Delivered</span>
          </Link>
          <Link href="/dashboard/orders" className={styles.orderStat}>
            <div className={styles.orderStatIcon}>
              <Package size={20} />
            </div>
            <span>All Orders</span>
          </Link>
        </div>
      </div>

      <div className={styles.dashboardSection}>
        <h3 className={styles.sectionTitle}>Shopping</h3>
        <div className={styles.menuList}>
          <Link href="/dashboard/cart" className={styles.menuItem}>
            <div className={styles.menuItemIcon}>
              <ShoppingBag size={20} />
            </div>
            <div className={styles.menuItemText}>My Cart</div>
            <ChevronRight size={18} className={styles.menuItemArrow} />
          </Link>
          
          <Link href="/dashboard/wishlist" className={styles.menuItem}>
            <div className={styles.menuItemIcon}>
              <Heart size={20} />
            </div>
            <div className={styles.menuItemText}>Wishlist</div>
            <ChevronRight size={18} className={styles.menuItemArrow} />
          </Link>
        </div>
      </div>

      <div className={styles.dashboardSection}>
        <h3 className={styles.sectionTitle}>Account Settings</h3>
        <div className={styles.menuList}>
          <Link href="/dashboard/profile" className={styles.menuItem}>
            <div className={styles.menuItemIcon}>
              <User size={20} />
            </div>
            <div className={styles.menuItemText}>Personal Information</div>
            <ChevronRight size={18} className={styles.menuItemArrow} />
          </Link>
          
          <Link href="/dashboard/addresses" className={styles.menuItem}>
            <div className={styles.menuItemIcon}>
              <MapPin size={20} />
            </div>
            <div className={styles.menuItemText}>Addresses</div>
            <ChevronRight size={18} className={styles.menuItemArrow} />
          </Link>
          
          <Link href="/dashboard/payment-methods" className={styles.menuItem}>
            <div className={styles.menuItemIcon}>
              <CreditCard size={20} />
            </div>
            <div className={styles.menuItemText}>Payment Methods</div>
            <ChevronRight size={18} className={styles.menuItemArrow} />
          </Link>
          
          <Link href="/dashboard/notifications" className={styles.menuItem}>
            <div className={styles.menuItemIcon}>
              <Bell size={20} />
            </div>
            <div className={styles.menuItemText}>Notification Settings</div>
            <ChevronRight size={18} className={styles.menuItemArrow} />
          </Link>
        </div>
      </div>

      <div className={styles.dashboardSection}>
        <h3 className={styles.sectionTitle}>Support</h3>
        <div className={styles.menuList}>
          <Link href="/dashboard/support/tickets" className={styles.menuItem}>
            <div className={styles.menuItemIcon}>
              <Ticket size={20} />
            </div>
            <div className={styles.menuItemText}>Support Tickets</div>
            <ChevronRight size={18} className={styles.menuItemArrow} />
          </Link>
          
          <Link href="/help" className={styles.menuItem}>
            <div className={styles.menuItemIcon}>
              <HelpCircle size={20} />
            </div>
            <div className={styles.menuItemText}>Help Center</div>
            <ChevronRight size={18} className={styles.menuItemArrow} />
          </Link>
          
          <Link href="/privacy" className={styles.menuItem}>
            <div className={styles.menuItemIcon}>
              <Shield size={20} />
            </div>
            <div className={styles.menuItemText}>Privacy & Security</div>
            <ChevronRight size={18} className={styles.menuItemArrow} />
          </Link>
        </div>
      </div>

      <button 
        onClick={handleLogout} 
        disabled={loggingOut}
        className={styles.logoutButton}
      >
        <LogOut size={18} />
        {loggingOut ? 'Logging out...' : 'Log Out'}
      </button>
    </div>
  )
} 