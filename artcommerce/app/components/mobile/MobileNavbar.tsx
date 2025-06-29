'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'
import { Search, Menu, X, User, ShoppingBag, Heart, ShoppingCart, Home, Grid, Package } from 'lucide-react'
import styles from './mobile.module.css'
import { getImageUrl } from '../../../lib/cloudinaryImages'

export default function MobileNavbar() {
  const { user } = useAuth()
  const { cartItems } = useCart()
  const { wishlistItems } = useWishlist()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  return (
    <>
      <header className={`${styles.mobileHeader} ${isScrolled ? styles.scrolled : ''}`}>
        <button 
          className={styles.menuButton} 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>
        
        <Link href="/" className={styles.logoContainer}>
          <Image
            src={getImageUrl('logo.png')}
            alt="Artcommerce Logo"
            width={50}
            height={16}
            priority
            style={{ objectFit: 'contain' }}
            className={styles.logo}
          />
        </Link>
        
        <div className={styles.navActions}>
          <Link href="/search" className={styles.navIcon}>
            <Search size={22} />
          </Link>
          
          <Link 
            href={user ? "/dashboard/cart" : "/auth/login"} 
            className={styles.navIcon}
          >
            <ShoppingCart size={22} />
            {user && cartItems.length > 0 && (
              <span className={styles.badge}>{cartItems.length}</span>
            )}
          </Link>
        </div>
      </header>
      
      {/* Mobile Menu Overlay */}
      <div 
        className={`${styles.menuOverlay} ${isMenuOpen ? styles.menuOverlayVisible : ''}`}
        onClick={() => setIsMenuOpen(false)}
      />
      
      {/* Mobile Menu Panel */}
      <div className={`${styles.menuPanel} ${isMenuOpen ? styles.menuPanelVisible : ''}`}>
        <div className={styles.menuHeader}>
          {user ? (
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName || 'User'} />
                ) : (
                  <User size={28} />
                )}
              </div>
              <div className={styles.userDetails}>
                <p className={styles.userName}>{user.fullName || 'User'}</p>
                <p className={styles.userEmail}>{user.email}</p>
              </div>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/auth/login" className={styles.authButton}>
                Log In
              </Link>
              <Link href="/auth/signup" className={styles.authButton}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
        
        <nav className={styles.mobileNav}>
          <Link href="/" className={styles.navLink}>
            <Home size={20} />
            <span>Home</span>
          </Link>
          
          <Link href="/products" className={styles.navLink}>
            <Grid size={20} />
            <span>Products</span>
          </Link>
          
          <Link href={user ? "/dashboard/wishlist" : "/auth/login"} className={styles.navLink}>
            <Heart size={20} />
            <span>Wishlist</span>
            {user && wishlistItems.length > 0 && (
              <span className={styles.navBadge}>{wishlistItems.length}</span>
            )}
          </Link>
          
          <Link href={user ? "/dashboard/orders" : "/auth/login"} className={styles.navLink}>
            <Package size={20} />
            <span>Orders</span>
          </Link>
          
          {user && (
            <Link href="/dashboard" className={styles.navLink}>
              <User size={20} />
              <span>Account</span>
            </Link>
          )}
        </nav>
        
        <div className={styles.menuFooter}>
          <p className={styles.copyright}>© {new Date().getFullYear()} Artcommerce</p>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <div className={styles.bottomNav}>
        <Link href="/" className={`${styles.bottomNavItem} ${pathname === '/' ? styles.active : ''}`}>
          <Home size={20} />
          <span>Home</span>
        </Link>
        
        <Link href="/products" className={`${styles.bottomNavItem} ${pathname.startsWith('/products') ? styles.active : ''}`}>
          <Grid size={20} />
          <span>Shop</span>
        </Link>
        
        <Link href={user ? "/dashboard/wishlist" : "/auth/login"} className={`${styles.bottomNavItem} ${pathname.includes('wishlist') ? styles.active : ''}`}>
          <Heart size={20} />
          <span>Wishlist</span>
        </Link>
        
        <Link href={user ? "/dashboard/cart" : "/auth/login"} className={`${styles.bottomNavItem} ${pathname.includes('cart') ? styles.active : ''}`}>
          <ShoppingCart size={20} />
          <span>Cart</span>
          {user && cartItems.length > 0 && (
            <span className={styles.bottomNavBadge}>{cartItems.length}</span>
          )}
        </Link>
      </div>
    </>
  )
} 