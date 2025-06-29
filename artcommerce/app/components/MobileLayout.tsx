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

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 10) // Consider scrolled after minimal movement
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Rotating text animation for homepage
  useEffect(() => {
    if (!isHomePage) return;
    
    const items = ['coasters', 'wall art', 'home decor', 'custom pieces']
    let currentIndex = 0

    const rotateText = () => {
      currentIndex = (currentIndex + 1) % items.length
      setRotatingText(items[currentIndex])
    }

    const interval = setInterval(rotateText, 3000)
    return () => clearInterval(interval)
  }, [isHomePage])

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

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  // Mobile Collections Section component
  const MobileCollectionsSection = () => {
    return (
      <section className={styles.mobileCollectionsSection}>
        {/* Section Header */}
        <div className={styles.mobileSectionHeader}>
          <div className={styles.mobileHeaderLine}></div>
          <h2 className={styles.mobileSectionTitle}>Our Collections</h2>
          <div className={styles.mobileHeaderLine}></div>
        </div>
        
        {/* Collection Description */}
        <div className={styles.mobileCollectionDescription}>
          <p>Discover our handcrafted resin art pieces, each one uniquely created with passion and precision.</p>
        </div>
        
        {/* Mobile Carousel */}
        <div className={styles.mobileCarouselContainer}>
          <div className={styles.mobileCarouselTrack}>
            {/* First set of items */}
            {productCategories.map((category, index) => (
              <div
                key={`original-${index}`}
                className={styles.mobileProductCard}
                style={{animationDelay: `${index * 0.15}s`}}
              >
                <div className={styles.mobileCardInner}>
                  <img
                    src={category.image}
                    alt={category.alt}
                    className={styles.mobileProductImage}
                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400/f0f0f0/ccc?text=Image+Not+Found')}
                  />
                  <div className={styles.mobileCardOverlay}>
                    <button className={styles.mobileViewButton}>Explore</button>
                  </div>
                  <h3 className={styles.mobileCategoryTitle}>{category.title}</h3>
                </div>
              </div>
            ))}
            
            {/* Duplicate set for seamless looping */}
            {productCategories.map((category, index) => (
              <div
                key={`duplicate-${index}`}
                className={styles.mobileProductCard}
                style={{animationDelay: `${index * 0.15}s`}}
              >
                <div className={styles.mobileCardInner}>
                  <img
                    src={category.image}
                    alt={category.alt}
                    className={styles.mobileProductImage}
                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400/f0f0f0/ccc?text=Image+Not+Found')}
                  />
                  <div className={styles.mobileCardOverlay}>
                    <button className={styles.mobileViewButton}>Explore</button>
                  </div>
                  <h3 className={styles.mobileCategoryTitle}>{category.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Collection Footer */}
        <div className={styles.mobileCollectionFooter}>
          <p>Each piece tells a story through layers of color and texture, inviting you to bring the essence of artistic expression into your home.</p>
          <Link href="/products">
            <button className={styles.mobileExploreButton}>View All Collections</button>
          </Link>
        </div>
      </section>
    );
  };

  // Render mobile home page content or regular content
  const renderContent = () => {
    if (isHomePage) {
      return (
        <>
          {/* Mobile Home Video Section */}
          <div className={styles.mobileVideoContainer}>
            {/* Video with fallback image */}
            <picture>
              {/* Fallback image that will be shown if video fails */}
              <img 
                src={getImageUrl('featured3.JPG')}
                alt="Handcrafted resin art" 
                className={styles.mobileVideoBackground}
                style={{ display: 'none' }}
                id="mobileVideoFallback"
              />
            </picture>

            <video
              ref={videoRef}
              className={styles.mobileVideoBackground}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/images/loading.png"
              onError={(e) => {
                // If video fails to load, show the fallback image
                const videoElement = e.currentTarget;
                videoElement.style.display = 'none';
                const fallbackImage = document.getElementById('mobileVideoFallback');
                if (fallbackImage) fallbackImage.style.display = 'block';
              }}
            >
              <source 
                src={process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_URL || '/images/homepage_video.mp4'} 
                type="video/mp4" 
              />
              Your browser does not support the video tag.
            </video>

            <div className={styles.mobileVideoOverlay} />

            <div className={styles.mobileVideoContent}>
              <div className={styles.mobileHeaderText}>
                <div className={styles.mobileTopText}>A HANDCRAFTED ART STUDIO</div>
                <img
                  src={getImageUrl('logo.png')}
                  alt="Kalakraft Logo"
                  className={styles.mobileLogo}
                />
                <h1 className={styles.mobileTitle}>
                  Handcrafted resin art for <span id="mobileRotator">{rotatingText}</span>
                </h1>
              </div>
            </div>
            
            {/* Scroll indicator with double arrows */}
            <div className={styles.mobileScrollIndicator} onClick={handleScrollDown}>
              <div className={styles.mobileScrollArrow}></div>
              <div className={styles.mobileScrollArrow}></div>
            </div>
          </div>
          
          {/* Mobile Collections Section */}
          <MobileCollectionsSection />
          
          {/* Rest of the home page content */}
          {children}
        </>
      );
    }
    
    // Regular content for non-home pages
    return children;
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'mobile' ? 'desktop' : 'mobile'
    setViewMode(newMode)
    
    if (newMode === 'desktop') {
      onSwitchToDesktop()
    }
  }

  return (
    <div className={styles.mobileLayoutContainer}>
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
      
      {/* Mobile Content */}
      <main className={`${styles.mobileContent} ${isHomePage ? styles.homeContent : ''}`}>
        {renderContent()}
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
    </div>
  )
} 