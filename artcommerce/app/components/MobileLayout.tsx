'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { Search, Home, ShoppingBag, User, Menu, X, Heart, ShoppingCart, Monitor, ChevronDown } from 'lucide-react'
import { useMobileMenu } from '../contexts/MobileMenuContext'
import { getImageUrl } from '../../lib/cloudinaryImages'
import styles from './MobileLayout.module.css'
import MobileMenuPanel from './MobileMenuPanel'

interface MobileLayoutProps {
  children: React.ReactNode
  onSwitchToDesktop: () => void
}

export default function MobileLayout({ children, onSwitchToDesktop }: MobileLayoutProps) {
  const { user } = useAuth()
  const { cartItems } = useCart()
  const { wishlistItems } = useWishlist()
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isSearchClosing, setIsSearchClosing] = useState(false)
  const searchCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const [isScrolled, setIsScrolled] = useState(false)
  const [isFooterVisible, setIsFooterVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [rotatingText, setRotatingText] = useState('coasters')
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()

  // For handling the mobile/desktop view toggle
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile')

  // Product categories for the grid - expanded with more items
  const productCategories = [
    {
      image: getImageUrl('imagecollection1.png'),
      title: 'COASTERS',
      alt: 'Handcrafted resin coasters'
    },
    {
      image: getImageUrl('imageclock.png'),
      title: 'WALL ART',
      alt: 'Resin wall art pieces'
    },
    {
      image: getImageUrl('imagecollection99.png'),
      title: 'HOME DECOR',
      alt: 'Decorative resin items'
    },
    {
      image: getImageUrl('collectionwall.png'),
      title: 'CUSTOM PIECES',
      alt: 'Custom resin artwork'
    },
    {
      image: getImageUrl('category1.png'),
      title: 'CLOCKS',
      alt: 'Handcrafted resin clocks'
    },
    {
      image: getImageUrl('trayscollection.png'),
      title: 'JEWELRY TRAYS',
      alt: 'Elegant resin jewelry trays'
    },
    {
      image: getImageUrl('vases.png'),
      title: 'VASES',
      alt: 'Decorative resin vases'
    },
    {
      image: getImageUrl('category4.png'),
      title: 'TRAYS',
      alt: 'Stylish resin serving trays'
    }
  ];

  // For rotating text in the hero section
  const textOptions = ['coasters', 'clocks', 'trays', 'wall art', 'home decor']

  // Add scroll event listener for header and footer
  useEffect(() => {
    let prevScrollY = window.scrollY
    let scrollDirection = 0
    let lastScrollTime = Date.now()
    let scrollVelocity = 0
    let scrollTimer: NodeJS.Timeout | null = null
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const currentTime = Date.now()
      const timeDiff = currentTime - lastScrollTime
      
      // Calculate scroll velocity (pixels per millisecond)
      scrollVelocity = Math.abs(currentScrollY - prevScrollY) / Math.max(timeDiff, 1)
      
      // Header scroll effect
      setIsScrolled(currentScrollY > 10)
      
      // Determine scroll direction (1 for down, -1 for up)
      const currentDirection = currentScrollY > prevScrollY ? 1 : -1
      
      // Update scroll direction only if it changed
      if (currentDirection !== scrollDirection) {
        scrollDirection = currentDirection
      }
      
      // Clear any existing timer
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }
      
      // Footer visibility logic
      if (currentScrollY < 50) {
        // Always show footer when near the top
        setIsFooterVisible(true)
      } else if (
        scrollDirection > 0 && // Scrolling down
        scrollVelocity > 0.3 && // Fast scroll
        currentScrollY > 100 // Not at the very top
      ) {
        // Hide footer when scrolling down quickly
        setIsFooterVisible(false)
      } else if (scrollDirection < 0) { // Scrolling up
        // Show footer immediately when scrolling up
        setIsFooterVisible(true)
      }
      
      // Set a timer to show footer after scrolling stops
      scrollTimer = setTimeout(() => {
        if (currentScrollY > 50) {
          setIsFooterVisible(true)
        }
      }, 150) // Show after 150ms of no scrolling
      
      // Update values for next iteration
      prevScrollY = currentScrollY
      lastScrollTime = currentTime
      setLastScrollY(currentScrollY)
    }

    // Throttled scroll handler for smoother performance
    let lastRun = 0
    const scrollThreshold = 16 // ~60fps
    
    const throttledScroll = () => {
      const now = Date.now()
      if (now - lastRun >= scrollThreshold) {
        lastRun = now
        handleScroll()
      }
    }

    window.addEventListener('scroll', throttledScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }
    }
  }, [lastScrollY])

  // Rotating text effect
  useEffect(() => {
    let currentIndex = 0
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % textOptions.length
      setRotatingText(textOptions[currentIndex])
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

  // Handle video loading
  useEffect(() => {
    if (!isHomePage || !videoRef.current) return;
    
    const handleVideoLoading = () => {
      const videoElement = videoRef.current;
      const fallbackImage = document.getElementById('mobileVideoFallback');
      
      if (videoElement && fallbackImage) {
        // Check if video loaded successfully
        videoElement.addEventListener('loadeddata', () => {
          // Video loaded successfully
          videoElement.style.display = 'block';
          if (fallbackImage) fallbackImage.style.display = 'none';
        });
        
        videoElement.addEventListener('error', () => {
          // Video failed to load
          videoElement.style.display = 'none';
          if (fallbackImage) fallbackImage.style.display = 'block';
        });
        
        // Force reload the video
        videoElement.load();
      }
    };
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(handleVideoLoading, 300);
    
    return () => clearTimeout(timer);
  }, [isHomePage]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleProductsClick = () => {
    router.push('/products');
    // Close mobile menu if it's open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }

  const handleCartClick = () => {
    router.push('/dashboard/cart');
    // Close mobile menu if it's open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }

  const handleWishlistClick = () => {
    router.push('/dashboard/wishlist');
    // Close mobile menu if it's open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }

  const toggleSearch = () => {
    if (isSearchOpen) {
      closeSearch()
    } else {
      setIsSearchOpen(true)
      setIsSearchClosing(false)
      if (searchCloseTimeoutRef.current) {
        clearTimeout(searchCloseTimeoutRef.current)
      }
    }
  }

  const closeSearch = () => {
    setIsSearchClosing(true)
    
    if (searchCloseTimeoutRef.current) {
      clearTimeout(searchCloseTimeoutRef.current)
    }
    
    searchCloseTimeoutRef.current = setTimeout(() => {
      setIsSearchOpen(false)
      setIsSearchClosing(false)
    }, 300)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      closeSearch()
    }
  }

  // Handle escape key to close search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch()
      }
    }
    
    if (isSearchOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSearchOpen])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchCloseTimeoutRef.current) {
        clearTimeout(searchCloseTimeoutRef.current)
      }
    }
  }, [])

  // Handle scroll down from hero section
  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight - 60, // Subtract header height
      behavior: 'smooth'
    });
  };

  // When user clicks on scroll indicator
  useEffect(() => {
    if (!isHomePage) return;
    
    const scrollIndicator = document.querySelector(`.${styles.scrollIndicator}`);
    if (scrollIndicator) {
      scrollIndicator.addEventListener('click', handleScrollDown);
      return () => {
        scrollIndicator.removeEventListener('click', handleScrollDown);
      };
    }
  }, [isHomePage]);

  // Mobile Collections Section component
  const MobileCollectionsSection = () => {
    // This is the duplicate section we want to remove
    return null; // Return null to not render anything
  }

  const toggleViewMode = () => {
    const newMode = viewMode === 'mobile' ? 'desktop' : 'mobile'
    setViewMode(newMode)
    
    if (newMode === 'desktop') {
      onSwitchToDesktop()
    }
  }

  // Function to determine if a path is active
  const isActivePath = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    if (path === '/products') {
      // Match /products and any subpaths like /products?category=clocks
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

  return (
    <div className={styles.mobileLayoutContainer}>
      {/* Home page specific content - Put at the top */}
      {isHomePage && (
        <div className={styles.curvedCardContainer}>
          <div className={styles.curvedHeroCard}>
            <div className={styles.curvedHeroBackground}></div>
            
            {/* Video background with fallback */}
            <picture>
              {/* Fallback image that will be shown if video fails */}
              <img 
                src={getImageUrl('featured3.JPG')}
                alt="Handcrafted resin art" 
                className={styles.curvedHeroVideo}
                style={{ display: 'none' }}
                id="mobileVideoFallback"
              />
            </picture>
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              className={styles.curvedHeroVideo}
              poster="/images/loading.png"
              preload="metadata"
              onError={(e) => {
                // If video fails to load, show the fallback image
                const videoElement = e.currentTarget;
                videoElement.style.display = 'none';
                document.getElementById('mobileVideoFallback')!.style.display = 'block';
              }}
            >
              <source 
                src={process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_URL || '/images/homepage_video.mp4'} 
                type="video/mp4" 
              />
            </video>
            
            <div className={styles.curvedHeroContent}>
              {/* Top text - "A HANDCRAFTED ART STUDIO" */}
              <div className={styles.curvedHeroTopText}>A HANDCRAFTED ART STUDIO</div>
              
              {/* Logo */}
              <Image
                src={getImageUrl('logo.png')}
                alt="Artcommerce Logo"
                width={90}
                height={30}
                className={styles.curvedHeroLogo}
                priority
              />
              
              {/* Hero Text */}
              <h1 className={styles.curvedHeroTitle}>
                Handcrafted resin art for {rotatingText}
              </h1>
              
              {/* Scroll indicator */}
              <div className={styles.scrollIndicator}>
                <ChevronDown size={30} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <header 
        className={`${styles.mobileHeader} ${isHomePage ? styles.homeMobileHeader : ''}`}
        data-scrolled={isScrolled ? 'true' : 'false'}
      >
        {/* Left side - Logo */}
        <Link href="/" className={styles.logoContainer}>
          <Image
            src={getImageUrl('logo.png')}
            alt="Artcommerce Logo"
            width={110}
            height={36}
            priority
            style={{ objectFit: 'contain' }}
            className={styles.logo}
          />
        </Link>
        
        {/* Center - Empty spacer */}
        <div className={styles.headerSpacer}></div>
        
        {/* Right side - Icons and burger menu */}
        <div className={styles.headerIcons}>
          {/* Search Icon */}
          <button 
            onClick={toggleSearch}
            className={styles.headerIconButton}
            aria-label="Search"
          >
            <Search size={20} strokeWidth={2} />
          </button>
          
          {/* Cart Icon */}
          <button 
            onClick={handleCartClick}
            className={styles.headerIconButton}
            aria-label="Cart"
          >
            <ShoppingCart size={20} />
            {cartItems.length > 0 && (
              <span className={styles.cartBadge}>{cartItems.length}</span>
            )}
          </button>
        </div>
        
        {/* Burger menu */}
        <button 
          onClick={toggleMobileMenu}
          className={styles.menuButton}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <Menu size={24} strokeWidth={2.5} />
        </button>
      </header>
      
      {/* Main Content Area */}
      <main className={styles.mobileContent}>
        {children}
      </main>
      
      {/* Mobile Footer Navigation */}
      <nav className={`${styles.mobileFooter} ${isFooterVisible ? styles.footerVisible : styles.footerHidden}`}>
        <Link 
          href="/" 
          className={`${styles.footerNavItem} ${isActivePath('/') ? styles.active : ''}`}
        >
          <Home size={20} />
          <span>Home</span>
        </Link>
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
        <Link 
          href={user ? '/dashboard/profile' : '/auth/login'} 
          className={`${styles.footerNavItem} ${isActivePath('/dashboard/profile') || isActivePath('/auth/login') ? styles.active : ''}`}
        >
          <User size={20} />
          <span>Account</span>
        </Link>
      </nav>
      
      {/* Mobile side menu panel */}
      <MobileMenuPanel 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        toggleViewMode={toggleViewMode}
        viewMode={viewMode}
      />
      
      {/* Overlay for when side menu is open */}
      {isMobileMenuOpen && (
        <div 
          className={styles.menuOverlay} 
          onClick={() => setIsMobileMenuOpen(false)} 
          aria-hidden="true"
        />
      )}
      
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className={`${styles.searchOverlay} ${isSearchClosing ? styles.searchOverlayClosing : ''}`}>
          <div className={styles.searchContainer}>
            <div className={styles.searchHeader}>
              <div className={styles.logoContainer}>
                <Image 
                  src={getImageUrl('logo.png')}
                  alt="Kalakraft"
                  width={120}
                  height={32}
                  className={styles.logoImage}
                />
              </div>
              <button 
                onClick={closeSearch}
                className={styles.closeButton}
                aria-label="Close search"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.searchContent}>
              <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                <div className={styles.searchInputContainer}>
                  <Search size={20} className={styles.searchIcon} />
                  <input 
                    type="text" 
                    placeholder="SEARCH PRODUCTS..." 
                    className={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button 
                      type="button"
                      className={styles.clearButton}
                      onClick={() => setSearchQuery('')}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
              
              <div className={styles.categoriesContainer}>
                <button className={`${styles.categoryPill}`}>CLOCK</button>
                <button className={styles.categoryPill}>POTS</button>
                <button className={styles.categoryPill}>TRAYS</button>
                <button className={styles.categoryPill}>JEWELERY TRAYS</button>
                <button className={styles.categoryPill}>RANGOLI</button>
                <button className={styles.categoryPill}>WALL DECOR</button>
                <button className={styles.categoryPill}>MATT RANGOLI</button>
                <button className={styles.categoryPill}>MIRROR WORK</button>
              </div>
              
              <div className={styles.quickFilters}>
                <button className={styles.quickFilterButton}>New Arrivals</button>
                <button className={styles.quickFilterButton}>Trending</button>
                <button className={styles.quickFilterButton}>Popular</button>
                <button className={styles.quickFilterButton}>On Sale</button>
              </div>
              
              <div className={styles.searchResults}>
                {/* Search results would appear here */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation removed as we're using the footer instead */}
    </div>
  )
} 