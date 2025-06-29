'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const [isScrolled, setIsScrolled] = useState(false)
  const [rotatingText, setRotatingText] = useState('coasters')
  const videoRef = useRef<HTMLVideoElement>(null)

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

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 10) // Consider scrolled after minimal movement
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
              {/* Logo */}
              <Image
                src={getImageUrl('logo.png')}
                alt="Artcommerce Logo"
                width={120}
                height={40}
                className={styles.curvedHeroLogo}
                priority
              />
              
              {/* Hero Text */}
              <h1 className={styles.curvedHeroTitle}>
                Artistic {rotatingText}
              </h1>
              <p className={styles.curvedHeroSubtitle}>
                Built to make your home extraordinarily beautiful, 
                Kalakraft is the best way to decorate with art.
              </p>
              
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
            width={90}
            height={28}
            priority
            style={{ objectFit: 'contain' }}
            className={styles.logo}
          />
        </Link>
        
        {/* Center - Empty spacer */}
        <div className={styles.headerSpacer}></div>
        
        {/* Right side - Burger menu */}
        <button 
          onClick={toggleMobileMenu}
          className={styles.menuButton}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <Menu size={24} />
        </button>
      </header>
      
      {/* Main Content Area */}
      <main className={styles.mobileContent}>
        {children}
      </main>
      
      {/* Mobile Footer Navigation */}
      <footer className={styles.mobileFooter}>
        <Link href="/" className={styles.footerNavItem}>
          <Home size={20} />
          <span>Home</span>
        </Link>
        
        <Link href="/products" className={styles.footerNavItem}>
          <ShoppingBag size={20} />
          <span>Shop</span>
        </Link>
        
        <Link href="/wishlist" className={styles.footerNavItem}>
          <Heart size={20} />
          <span>Wishlist</span>
          {wishlistItems.length > 0 && (
            <span className={styles.badge}>{wishlistItems.length}</span>
          )}
        </Link>
        
        <Link href={user ? "/dashboard" : "/auth/login"} className={styles.footerNavItem}>
          <User size={20} />
          <span>{user ? "Account" : "Login"}</span>
        </Link>
      </footer>
      
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
        <div className={styles.searchOverlay}>
          <div className={styles.searchContainer}>
            <div className={styles.searchHeader}>
              <button 
                onClick={() => setIsSearchOpen(false)}
                className={styles.closeButton}
              >
                <X size={24} />
              </button>
              <h3>Search</h3>
            </div>
            <input 
              type="text" 
              placeholder="Search products..." 
              className={styles.searchInput}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className={styles.mobileBottomNav}>
        <Link href="/" className={styles.bottomNavItem}>
          <Home size={24} />
          <span>Home</span>
        </Link>
        <Link href="/products" className={styles.bottomNavItem}>
          <ShoppingBag size={24} />
          <span>Shop</span>
        </Link>
        <Link href="/dashboard/wishlist" className={styles.bottomNavItem}>
          <Heart size={24} />
          <span>Wishlist</span>
        </Link>
        <Link href={user ? '/dashboard/profile' : '/auth/login'} className={styles.bottomNavItem}>
          <User size={24} />
          <span>{user ? 'Account' : 'Login'}</span>
        </Link>
      </nav>
    </div>
  )
} 