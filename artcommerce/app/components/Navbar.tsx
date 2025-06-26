// File: app/components/Navbar.tsx
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { Search as SearchIcon, Menu, X, User, LogOut, Grid, ShoppingBag, Heart, ShoppingCart, HelpCircle } from 'lucide-react'
import SearchModal from './SearchModal'
import styles from './Navbar.module.css'
import { useMobileMenu } from '../contexts/MobileMenuContext'

const categories = [
  {
    title: 'Home Decor',
    items: [
      {
        name: 'Clocks',
        description: 'Handcrafted timepieces',
        image: '/images/category1.png'
      },
      {
        name: 'Wall Art',
        description: 'Unique wall decorations',
        image: '/images/category6.png'
      }
    ]
  },
  {
    title: 'Traditional Art',
    items: [
      {
        name: 'Rangolis',
        description: 'Traditional floor art',
        image: '/images/category8.png'
      },
      {
        name: 'Matt Rangoli',
        description: 'Modern matt finish rangolis',
        image: '/images/category5.png'
      }
    ]
  },
  {
    title: 'Art & Decor',
    items: [
      {
        name: 'Paintings',
        description: 'Hand-painted artworks',
        image: '/images/category7.png'
      },
      {
        name: 'Pots & Vases',
        description: 'Handcrafted ceramic pieces',
        image: '/images/category3.png'
      }
    ]
  },
  {
    title: 'Trays',
    items: [
      {
        name: 'Jewelry Trays',
        description: 'Elegant organizers for your precious pieces',
        image: '/images/category2.png'
      },
      {
        name: 'Trays',
        description: 'Beautiful trays for serving in style',
        image: '/images/category4.png'
      }
    ]
  }
];

const featuredItems = [
  {
    name: 'Antique Clock Collection',
    image: '/images/featured1.png'
  },
  {
    name: 'Premium Rangoli Set',
    image: '/images/featured2.png'
  },
  {
    name: 'Designer Pottery',
    image: '/images/featured3.JPG'
  }
];

export default function Navbar() {
  const { user, loading, logout } = useAuth()
  const { cartItems } = useCart()
  const { wishlistItems } = useWishlist()
  const [searchOpen, setSearchOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()
  const [isMinimized, setIsMinimized] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const [showMegaMenu, setShowMegaMenu] = useState(false)
  const [isSignupActive, setIsSignupActive] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const isHomePage = pathname === '/'

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsMinimized(scrollPosition > 100) // Minimize after scrolling 100px
      setIsScrolled(scrollPosition > 10) // Consider scrolled after minimal movement
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset mobile menu when auth state changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [user, setIsMobileMenuOpen])

  // Reset profile dropdown when auth state changes
  useEffect(() => {
    setIsProfileOpen(false)
  }, [user])

  const handleLogout = useCallback(async () => {
    setIsProfileOpen(false)
    await logout()
  }, [logout])

  // Debug search state
  useEffect(() => {
    console.log('Search state changed:', searchOpen)
  }, [searchOpen])

  // Only show search on these base routes (and their children)
  const enableSearch = ['/', '/products', '/dashboard'].some(
    base => pathname === base || pathname.startsWith(base + '/')
  )

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Store the initial touch X position
    (e.currentTarget as HTMLElement).dataset.startX = e.touches[0].clientX.toString();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const startX = parseFloat(((e.currentTarget as HTMLElement).dataset.startX) || '0');
    const endX = e.changedTouches[0].clientX;
    const threshold = 50; // Minimum swipe distance to trigger close

    // If the menu is open (on the left) and the swipe is from left to right (away from the menu)
    if (isMobileMenuOpen && (endX - startX) > threshold) {
      closeMobileMenu();
    }

    // If the overlay is being swiped from right to left (towards the menu)
    // This might be more intuitive if the menu itself is swiped left to close it.
    // Let's focus on swiping the overlay to the right (away from the menu) to close it.
    // Or, swiping the menu itself to the left to close it.

    // For now, let's keep it simple: if you swipe *right* on the overlay, it closes.
    // This mimics swiping the menu to the left from its right edge.
    if (isMobileMenuOpen && (endX - startX) > threshold) {
      closeMobileMenu();
    }
  };

  const handleSearchClick = () => {
    setSearchOpen(true)
  }

  const handleSearchClose = (instant = false) => {
    setSearchOpen(false)
  }

  // Debug render
  console.log('Navbar rendering with searchOpen:', searchOpen)

  return (
    <>
      <div className={`${styles.megaMenuBackdrop} ${showMegaMenu ? styles.megaMenuBackdropVisible : ''}`} />
      <div className={`${styles.profileDropdownBackdrop} ${isProfileOpen ? styles.profileDropdownBackdropVisible : ''}`} />
      <nav 
        className={`${styles.navbar} ${isMinimized ? styles.minimized : ''} ${isHomePage ? styles.homeNavbar : ''}`} 
        data-scrolled={isScrolled ? 'true' : 'false'}
      >
        <div className={styles.left}>
          <button
            onClick={toggleMobileMenu}
            className={`${styles.mobileToggle} ${isMobileMenuOpen ? styles.mobileToggleOpen : ''}`}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <div className={`${styles.hamburgerIcon} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}>
              <span className={styles.line}></span>
              <span className={styles.line}></span>
              <span className={styles.line}></span>
            </div>
          </button>
          <Link href="/" className={styles.brand} onClick={closeMobileMenu}>
            <Image
              src="/images/logo.png"
              alt="Artcommerce Logo"
              width={180}
              height={50}
              priority
              style={{ objectFit: 'contain' }}
              className={styles.logo}
            />
          </Link>
        </div>
        
        <div className={styles.center}>
          <Link href="/" className={styles.link}>
            Home
          </Link>
          <div 
            className={styles.productLink}
            onMouseEnter={() => setShowMegaMenu(true)}
            onMouseLeave={() => setShowMegaMenu(false)}
          >
            <span>Categories</span>
            {/* Mega Menu */}
            <div className={`${styles.megaMenu} ${showMegaMenu ? styles.megaMenuVisible : ''}`}>
              {categories.map((category, idx) => (
                <div key={idx} className={styles.categoryGroup}>
                  <h3 className={styles.categoryTitle}>{category.title}</h3>
                  {category.items.map((item, itemIdx) => (
                    <Link 
                      href={`/products?category=${
                        item.name === 'Trays' ? 'tray' : 
                        item.name === 'Jewelry Trays' ? 'Tray' :
                        item.name === 'Wall Decor' ? 'decor' :
                        item.name === 'Matt Rangoli' ? 'matt rangoli' :
                        item.name === 'Mirror Work' ? 'mirror work' :
                        item.name.toLowerCase()
                      }`}
                      key={itemIdx}
                      className={styles.categoryItem}
                      onClick={() => setShowMegaMenu(false)}
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={50}
                        height={50}
                        className={styles.categoryImage}
                      />
                      <div className={styles.categoryInfo}>
                        <span className={styles.categoryName}>{item.name}</span>
                        <span className={styles.categoryDesc}>{item.description}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
              
              {/* Featured Section */}
              <div className={styles.featuredSection}>
                <h3 className={styles.featuredTitle}>Featured Collections</h3>
                <div className={styles.featuredGrid}>
                  {featuredItems.map((item, idx) => (
                    <div key={idx} className={styles.featuredItem}>
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={200}
                        height={200}
                        className={styles.featuredImage}
                      />
                      <div className={styles.featuredOverlay}>
                        <span>{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <Link href="/products" className={styles.link}>
            All Products
          </Link>
          {/* Contact Support moved to profile dropdown */}
        </div>

        <div className={styles.right}>
          <button
            onClick={handleSearchClick}
            className={`${styles.icon} ${styles.searchTrigger}`}
            aria-label="Open search"
            aria-expanded={searchOpen}
          >
            <SearchIcon 
              size={22} 
              className={styles.searchIcon}
              style={{
                animation: !searchOpen ? 'pulse 2s infinite' : 'none',
                transition: 'all 0.3s ease-out'
              }}
            />
          </button>

          <Link
            href={user ? '/dashboard/wishlist' : '/auth/login'}
            className={styles.icon}
            aria-label="Your Wishlist"
          >
            <Heart size={22} />
            {user && wishlistItems.length > 0 && (
              <span className={styles.badge}>
                {wishlistItems.length}
              </span>
            )}
          </Link>

          <Link
            href={user ? '/dashboard/cart' : '/auth/login'}
            className={styles.icon}
            aria-label="Your Cart"
          >
            <ShoppingCart size={22} />
            {user && cartItems.length > 0 && (
              <span className={styles.badge}>
                {cartItems.length}
              </span>
            )}
          </Link>

          <div className="hidden md:flex items-center relative" ref={profileDropdownRef}>
            {loading ? (
              <div className={styles.loadingIndicator}>
                <div className={styles.spinner} />
              </div>
            ) : user ? (
              <>
                <Link 
                  href="/dashboard/profile" 
                  className={styles.profileButton}
                  onClick={(e) => {
                    e.preventDefault(); // Prevent navigation
                    setIsProfileOpen(!isProfileOpen);
                  }}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName || 'Profile'}
                      className={styles.profileImage}
                    />
                  ) : (
                    <User className={styles.profileIcon} />
                  )}
                </Link>

                <div className={`${styles.profileDropdown} ${isProfileOpen ? styles.profileDropdownOpen : ''}`}>
                  {user.fullName && (
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>{user.fullName}</div>
                      {user.email && <div className={styles.userEmail}>{user.email}</div>}
                    </div>
                  )}
                  
                  <Link href="/dashboard/profile" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                    <User size={18} />
                    Profile
                  </Link>
                  <Link href="/dashboard" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                    <Grid size={18} />
                    Dashboard
                  </Link>
                  <Link href="/dashboard/orders" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                    <ShoppingBag size={18} />
                    Orders
                  </Link>
                  <Link href="/dashboard/support" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                    <HelpCircle size={18} />
                    Contact Support
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <button
                    onClick={handleLogout}
                    className={styles.dropdownItem}
                  >
                    <LogOut size={18} />
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className={`${styles.authToggleContainer} ${isSignupActive ? styles.signupActive : ''}`}>
                <div className={styles.authToggleBackground} />
                <Link
                  href="/auth/login"
                  className={`${styles.authToggleButton} ${!isSignupActive ? styles.active : ''}`}
                  onClick={() => setIsSignupActive(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className={`${styles.authToggleButton} ${isSignupActive ? styles.active : ''}`}
                  onClick={() => setIsSignupActive(true)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {searchOpen && (
        <SearchModal
          open={searchOpen}
          onClose={(instantClose) => handleSearchClose(instantClose)}
        />
      )}

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenuWrapper} ${isMobileMenuOpen ? styles.mobileMenuWrapperOpen : ''}`}>
        <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          {/* Mobile menu content */}
        </div>
      </div>
      
      {/* Overlay */}
      <div 
        className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
    </>
  )
}