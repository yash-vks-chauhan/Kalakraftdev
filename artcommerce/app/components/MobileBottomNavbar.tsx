'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { Home, ShoppingBag, User, Heart, Grid, HelpCircle, LogOut } from 'lucide-react'
import styles from './MobileBottomNavbar.module.css'

export default function MobileBottomNavbar() {
  const { user, logout } = useAuth()
  const { cartItems } = useCart()
  const { wishlistItems } = useWishlist()
  const pathname = usePathname()
  const router = useRouter()
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  const accountDropdownRef = useRef<HTMLDivElement>(null)

  const isActivePath = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    if (path === '/products') {
      return pathname.startsWith('/products')
    }
    if (path === '/dashboard/cart') {
      return pathname.startsWith('/dashboard/cart')
    }
    if (path === '/dashboard/wishlist') {
      return pathname.startsWith('/dashboard/wishlist')
    }
    return pathname.startsWith(path)
  }

  const handleHomeClick = () => {
    if (pathname === '/') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      router.push('/');
    }
  }

  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const target = e.currentTarget;
    target.classList.add(styles.buttonPulse);
    setTimeout(() => {
      target.classList.remove(styles.buttonPulse);
    }, 300);
    
    setIsAccountDropdownOpen(prev => !prev)
  }

  const handleLogout = async () => {
    try {
      await logout()
      setIsAccountDropdownOpen(false)
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <>
      {/* Backdrop for account dropdown */}
      {isAccountDropdownOpen && (
        <div className={styles.mobileBackdrop} onClick={() => setIsAccountDropdownOpen(false)}></div>
      )}

      {/* Mobile Footer Navigation */}
      <nav className={styles.mobileFooter}>
        <button 
          onClick={handleHomeClick}
          className={`${styles.footerNavItem} ${isActivePath('/') ? styles.active : ''}`}
        >
          <Home size={20} />
          <span>Home</span>
        </button>
        <Link 
          href="/products" 
          className={`${styles.footerNavItem} ${isActivePath('/products') ? styles.active : ''}`}
        >
          <ShoppingBag size={20} />
          <span>Products</span>
        </Link>
        <Link 
          href={user ? '/dashboard/wishlist' : '/auth/login'}
          className={`${styles.footerNavItem} ${isActivePath('/dashboard/wishlist') ? styles.active : ''}`}
        >
          <Heart size={20} />
          <span>Wishlist</span>
          {wishlistItems.length > 0 && (
            <span className={styles.badge}>{wishlistItems.length}</span>
          )}
        </Link>
        <div className={styles.footerNavItemContainer} ref={accountDropdownRef}>
          <button 
            onClick={handleAccountClick}
            className={`${styles.footerNavItem} ${isActivePath('/dashboard/profile') || isActivePath('/auth/login') ? styles.active : ''}`}
          >
            <User size={20} />
            <span>Account</span>
          </button>
          
          {/* Account Dropdown */}
          <div className={`${styles.profileDropdownBackdrop} ${isAccountDropdownOpen ? styles.profileDropdownBackdropVisible : ''}`} />
          
          {/* Show different dropdown content based on authentication status */}
          {isAccountDropdownOpen && (
            <div
              ref={accountDropdownRef}
              className={`${styles.accountDropdown} ${isAccountDropdownOpen ? styles.accountDropdownOpen : ''}`}
            >
              {user ? (
                /* Logged in user dropdown content */
                <>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.fullName || 'User'}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                  
                  <Link href="/dashboard/profile" className={styles.dropdownItem} onClick={() => setIsAccountDropdownOpen(false)}>
                    <User size={20} />
                    Profile
                  </Link>
                  
                  <Link href="/dashboard" className={styles.dropdownItem} onClick={() => setIsAccountDropdownOpen(false)}>
                    <Grid size={20} />
                    Dashboard
                  </Link>
                  
                  <Link href="/dashboard/orders" className={styles.dropdownItem} onClick={() => setIsAccountDropdownOpen(false)}>
                    <ShoppingBag size={20} />
                    Orders
                  </Link>
                  
                  <Link href="/support" className={styles.dropdownItem} onClick={() => setIsAccountDropdownOpen(false)}>
                    <HelpCircle size={20} />
                    Support
                  </Link>
                  
                  <div className={styles.dropdownDivider} />
                  
                  <button onClick={handleLogout} className={styles.dropdownItem}>
                    <LogOut size={20} />
                    Sign out
                  </button>
                </>
              ) : (
                /* Not logged in - show login/signup options */
                <>
                  <div className={styles.guestInfo}>
                    <div className={styles.guestTitle}>Account</div>
                    <div className={styles.guestSubtitle}>Sign in to access your account</div>
                  </div>
                  
                  <Link href="/auth/login" className={styles.dropdownItem} onClick={() => setIsAccountDropdownOpen(false)}>
                    <LogOut size={20} style={{ transform: 'rotate(180deg)' }} />
                    Sign In
                  </Link>
                  
                  <Link href="/auth/signup" className={styles.dropdownItem} onClick={() => setIsAccountDropdownOpen(false)}>
                    <User size={20} />
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  )
}
