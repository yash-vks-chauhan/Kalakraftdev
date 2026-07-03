// File: app/components/Navbar.tsx
'use client'

import React, { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { Search as SearchIcon, Menu, X, User, LogOut, Grid, ShoppingBag, Heart, ShoppingCart, HelpCircle, Filter as FilterIcon, ChevronDown } from 'lucide-react'
import SearchModal from './SearchModal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import styles from './Navbar.module.css'
import { useMobileMenu } from '../contexts/MobileMenuContext'
import { getImageUrl } from '../../lib/cloudinaryImages'

// Flat, text-first menu — query values mirror the filters the products page
// already understands (same mapping the old grouped menu used).
const MENU_LINKS = [
  { name: 'Clocks', description: 'Handcrafted timepieces', query: 'clocks', image: 'category1.png' },
  { name: 'Wall Art', description: 'Unique wall decorations', query: 'wall art', image: 'category6.png' },
  { name: 'Rangolis', description: 'Traditional floor art', query: 'rangolis', image: 'category8.png' },
  { name: 'Matt Rangoli', description: 'Modern matt finish', query: 'matt rangoli', image: 'category5.png' },
  { name: 'Paintings', description: 'Hand-painted artworks', query: 'paintings', image: 'category7.png' },
  { name: 'Pots & Vases', description: 'Handcrafted ceramics', query: 'pots & vases', image: 'category3.png' },
  { name: 'Jewelry Trays', description: 'For your precious pieces', query: 'Tray', image: 'category2.png' },
  { name: 'Trays', description: 'Serving in style', query: 'tray', image: 'category4.png' },
];

const PRODUCT_SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

function ProductNavbarTools({ isMinimized }: { isMinimized: boolean }) {
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isSortOpen, setIsSortOpen] = useState(false)

  const productFilterCount = useMemo(() => {
    let n = 0
    if (searchParams.get('category')) n++
    if (searchParams.get('usageTag')) n++
    if (searchParams.get('ratingMin')) n++
    if (searchParams.get('inStock') === 'true') n++
    if (searchParams.get('lowStock') === 'true') n++
    return n
  }, [searchParams])

  const currentSort = searchParams.get('sort') || ''
  const currentSortLabel = PRODUCT_SORT_OPTIONS.find(o => o.value === currentSort)?.label || 'Newest'

  const handleToggleProductFilter = useCallback(() => {
    window.dispatchEvent(new CustomEvent('toggle-product-filter'))
  }, [])

  const handleSelectProductSort = useCallback((value: string) => {
    const qs = new URLSearchParams(searchParams.toString())
    if (value) qs.set('sort', value)
    else qs.delete('sort')
    router.replace(qs.toString() ? `${pathname}?${qs}` : pathname)
    setIsSortOpen(false)
  }, [searchParams, router, pathname])

  useEffect(() => {
    if (!isSortOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSortOpen])

  return (
    <div
      className={`${styles.productsTools} ${isMinimized ? styles.productsToolsVisible : ''}`}
      aria-hidden={!isMinimized}
    >
      <button
        type="button"
        onClick={handleToggleProductFilter}
        className={styles.productsToolBtn}
        aria-label="Toggle filters"
        tabIndex={isMinimized ? 0 : -1}
      >
        <FilterIcon size={14} strokeWidth={2} />
        <span>Filters</span>
        {productFilterCount > 0 && (
          <span className={styles.productsToolBadge}>{productFilterCount}</span>
        )}
      </button>

      <div className={styles.productsSortWrap} ref={sortDropdownRef}>
        <button
          type="button"
          onClick={() => setIsSortOpen(o => !o)}
          className={styles.productsToolBtn}
          aria-expanded={isSortOpen}
          aria-haspopup="listbox"
          tabIndex={isMinimized ? 0 : -1}
        >
          <span className={styles.productsToolMuted}>Sort:</span>
          <span>{currentSortLabel}</span>
          <ChevronDown
            size={14}
            strokeWidth={2}
            className={`${styles.productsToolChevron} ${isSortOpen ? styles.productsToolChevronOpen : ''}`}
          />
        </button>
        <div
          className={`${styles.productsSortMenu} ${isSortOpen ? styles.productsSortMenuOpen : ''}`}
          role="listbox"
          aria-hidden={!isSortOpen}
        >
          {PRODUCT_SORT_OPTIONS.map(opt => (
            <button
              key={opt.value || 'default'}
              type="button"
              role="option"
              aria-selected={currentSort === opt.value}
              onClick={() => handleSelectProductSort(opt.value)}
              className={`${styles.productsSortOption} ${currentSort === opt.value ? styles.productsSortOptionActive : ''}`}
              tabIndex={isSortOpen ? 0 : -1}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

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
  const [isScrolled, setIsScrolled] = useState(false)
  const [isPastHero, setIsPastHero] = useState(false)
  const isHomePage = pathname === '/'
  const isProductsPage = pathname === '/products'

  // The home page opens with a full-viewport dark hero: the bar stays
  // transparent (white content) until the hero scrolls away, then turns solid.
  const overDarkHero = isHomePage && !isPastHero

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsMinimized(scrollPosition > 100) // Minimize after scrolling 100px
      setIsScrolled(scrollPosition > 10) // Consider scrolled after minimal movement
      // The hero is sticky (the page scrolls over it), so it stays visible
      // until the covering content reaches the top of the viewport.
      setIsPastHero(scrollPosition > window.innerHeight - 72)
    }

    handleScroll()
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

  // ⌘K / Ctrl+K opens search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleLogout = useCallback(async () => {
    setIsProfileOpen(false)
    await logout()
  }, [logout])

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

  return (
    <>
      <div className={`${styles.megaMenuBackdrop} ${overDarkHero ? styles.megaMenuBackdropDark : ''} ${showMegaMenu ? styles.megaMenuBackdropVisible : ''}`} />
      <div className={`${styles.profileDropdownBackdrop} ${isProfileOpen ? styles.profileDropdownBackdropVisible : ''}`} />
      <nav
        className={`${styles.navbar} ${isMinimized ? styles.minimized : ''} ${overDarkHero ? styles.homeNavbar : ''}`}
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
            {/* Desktop: serif wordmark in the site's brand voice. Mobile keeps
                the image logo untouched. */}
            <span className={styles.wordmark}>kalakraft</span>
            <Image
              src={getImageUrl('logo.png')}
              alt="Artcommerce Logo"
              width={60}
              height={17}
              priority
              style={{ objectFit: 'contain' }}
              className={styles.logo}
            />
          </Link>
        </div>
        
        <div className={styles.center}>
          <Link href="/products" className={styles.link}>
            Shop
          </Link>
          <div
            className={styles.productLink}
            onMouseEnter={() => setShowMegaMenu(true)}
            onMouseLeave={() => setShowMegaMenu(false)}
          >
            <span>Collections</span>
            {/* Mega menu: text-first category list + one featured pour */}
            <div className={`${styles.megaMenu} ${showMegaMenu ? styles.megaMenuVisible : ''}`}>
              <div className={styles.menuLinks}>
                <p className={styles.menuHeading}>Shop by category</p>
                <div className={styles.menuGrid}>
                  {MENU_LINKS.map(item => (
                    <Link
                      href={`/products?category=${encodeURIComponent(item.query)}`}
                      key={item.name}
                      className={styles.menuItem}
                      onClick={() => setShowMegaMenu(false)}
                    >
                      <Image
                        src={getImageUrl(item.image)}
                        alt=""
                        width={44}
                        height={44}
                        className={styles.menuThumb}
                      />
                      <span className={styles.menuItemText}>
                        <span className={styles.menuItemName}>{item.name}</span>
                        <span className={styles.menuItemDesc}>{item.description}</span>
                      </span>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/products"
                  className={styles.menuAllLink}
                  onClick={() => setShowMegaMenu(false)}
                >
                  View all pieces →
                </Link>
              </div>

              <Link
                href="/products"
                className={styles.menuFeature}
                onClick={() => setShowMegaMenu(false)}
              >
                <Image
                  src={getImageUrl('category1.png')}
                  alt="Featured collection"
                  width={340}
                  height={420}
                  className={styles.menuFeatureImage}
                />
                <span className={styles.menuFeatureOverlay}>
                  <span className={styles.menuFeatureEyebrow}>Featured</span>
                  <span className={styles.menuFeatureTitle}>The latest pours</span>
                </span>
              </Link>
            </div>
          </div>
          <Link href="/#craft" className={styles.link}>
            Our craft
          </Link>
        </div>

        <div className={styles.right}>
          {isProductsPage && (
            <Suspense fallback={null}>
              <ProductNavbarTools isMinimized={isMinimized} />
            </Suspense>
          )}

          {/* Desktop: bordered command-palette trigger. Mobile: icon only. */}
          <button
            onClick={handleSearchClick}
            className={styles.searchPill}
            aria-label="Open search"
            aria-expanded={searchOpen}
          >
            <SearchIcon size={14} strokeWidth={1.75} />
            <span>Search</span>
            <kbd className={styles.searchKbd}>⌘K</kbd>
          </button>
          <button
            onClick={handleSearchClick}
            className={`${styles.icon} ${styles.searchTrigger} ${styles.searchIconMobile}`}
            aria-label="Open search"
            aria-expanded={searchOpen}
          >
            <SearchIcon size={20} strokeWidth={1.75} className={styles.searchIcon} />
          </button>

          <Link
            href={user ? '/dashboard/wishlist' : '/auth/login'}
            className={styles.icon}
            aria-label="Your Wishlist"
          >
            <Heart size={20} strokeWidth={1.75} />
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
            <ShoppingCart size={20} strokeWidth={1.75} />
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
              <div className="inline-flex items-center gap-2">
                <Button
                  asChild
                  variant="ghost"
                  className={cn(
                    'h-9 px-4 text-sm font-medium transition-colors',
                    overDarkHero
                      ? 'text-white/80 hover:bg-white/10 hover:text-white'
                      : 'text-[#666] hover:bg-black/[0.04] hover:text-[#1a1a1a]',
                  )}
                >
                  <Link href="/auth/login">Log in</Link>
                </Button>
                <Button
                  asChild
                  variant={overDarkHero ? 'outline' : 'default'}
                  className={cn(
                    'h-9 px-4 text-sm font-medium transition-colors',
                    overDarkHero
                      ? 'border-white/30 bg-transparent text-white hover:border-white/60 hover:bg-white/10 hover:text-white'
                      : 'bg-[#1a1a1a] text-white hover:bg-[#333]',
                  )}
                >
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

            <SearchModal
        open={searchOpen}
        onClose={handleSearchClose}
      />

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
