'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { Search, Home, ShoppingBag, User, Menu, X, Heart, ShoppingCart, Monitor, ChevronDown, Grid, HelpCircle, LogOut, ArrowLeft, Share } from 'lucide-react'
import { useMobileMenu } from '../contexts/MobileMenuContext'
import { getImageUrl } from '../../lib/cloudinaryImages'
import styles from './MobileLayout.module.css'
import MobileMenuPanel from './MobileMenuPanel'
import MobileSearchModal from './MobileSearchModal'

interface MobileLayoutProps {
  children: React.ReactNode
  onSwitchToDesktop: () => void
}

export default function MobileLayout({ children, onSwitchToDesktop }: MobileLayoutProps) {
  const { user, logout } = useAuth()
  const { cartItems } = useCart()
  const { wishlistItems } = useWishlist()
  const { isMobileMenuOpen, setIsMobileMenuOpen, isProductPage, isTransparentNavbar } = useMobileMenu()
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
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  const accountDropdownRef = useRef<HTMLDivElement>(null)
  const [productName, setProductName] = useState<string>('')

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

  // Close account dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false)
      }
    }
    
    // Only add listener when dropdown is open
    if (isAccountDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAccountDropdownOpen, accountDropdownRef])

  // Reset account dropdown when auth state changes
  useEffect(() => {
    setIsAccountDropdownOpen(false)
  }, [user])

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

  const handleHomeClick = () => {
    // If already on home page, scroll to top
    if (pathname === '/') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // Navigate to home page
      router.push('/');
    }
    
    // Close mobile menu if it's open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }

  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Add button pulse animation
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
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const carouselRef = useRef<HTMLDivElement>(null)

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true)
      setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0))
      setScrollLeft(carouselRef.current?.scrollLeft || 0)
    }

    const handleMouseLeave = () => {
      setIsDragging(false)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()
      const x = e.pageX - (carouselRef.current?.offsetLeft || 0)
      const walk = (x - startX) * 2
      if (carouselRef.current) {
        carouselRef.current.scrollLeft = scrollLeft - walk
      }
    }

    const handleTouchStart = (e: React.TouchEvent) => {
      setIsDragging(true)
      setStartX(e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0))
      setScrollLeft(carouselRef.current?.scrollLeft || 0)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return
      const x = e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0)
      const walk = (x - startX) * 2
      if (carouselRef.current) {
        carouselRef.current.scrollLeft = scrollLeft - walk
      }
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
    }

    return (
      <section className={styles.mobileCollectionsSection}>
        <div className={styles.mobileSectionHeader}>
          <div className={styles.mobileHeaderLine} />
          <h2 className={styles.mobileSectionTitle}>Our Collections</h2>
          <div className={styles.mobileHeaderLine} />
        </div>

        <div className={styles.mobileCollectionDescription}>
          <p>Discover our handcrafted pieces, each telling a unique story through artistry and innovation</p>
        </div>

        <div className={styles.mobileCarouselContainer}>
          <div
            ref={carouselRef}
            className={styles.mobileCarouselTrack}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {productCategories.map((category, index) => (
              <div key={index} className={styles.mobileProductCard}>
                <div className={styles.mobileCardInner}>
                  <Image
                    src={category.image}
                    alt={category.alt}
                    className={styles.mobileProductImage}
                    fill
                    sizes="(max-width: 768px) 75vw, 33vw"
                    priority={index < 2}
                  />
                  <div className={styles.mobileCategoryTitle}>
                    {category.title}
                  </div>
                  <div className={styles.mobileCardOverlay}>
                    <button className={styles.mobileViewButton}>
                      View Collection
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.mobileCollectionFooter}>
          <p>Explore our complete collection of handcrafted pieces</p>
          <Link href="/products" className={styles.mobileExploreButton}>
            View All Collections
          </Link>
        </div>
      </section>
    )
  }

  // Mobile Video Section component - Instagram style video showcase
  const MobileVideoSection = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    
    // Video URL from environment variable or direct URL
    const videoUrl = process.env.NEXT_PUBLIC_INSTAGRAM_VIDEO_URL || "https://res.cloudinary.com/downe8107/video/upload/v1752756632/Goal_make_the_202507170106_9lp5g_rosxzs.mp4";
    
    // Use Intersection Observer to auto-play when video is visible
    useEffect(() => {
      if (!videoContainerRef.current || !videoRef.current) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          
          if (entry.isIntersecting && videoRef.current) {
            videoRef.current.play()
              .catch(err => console.error('Video play failed:', err));
          } else if (!entry.isIntersecting && videoRef.current) {
            videoRef.current.pause();
          }
        },
        { threshold: 0.3 } // Trigger when 30% of the video is visible
      );
      
      observer.observe(videoContainerRef.current);
      
      return () => {
        if (videoContainerRef.current) {
          observer.unobserve(videoContainerRef.current);
        }
      };
    }, []);
    
    // Toggle mute/unmute
    const toggleMute = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (videoRef.current) {
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(!isMuted);
      }
    };
    
    return (
      <section className={styles.mobileVideoSection}>
        <div className={styles.mobileSectionHeader}>
          <div className={styles.mobileHeaderLine} />
          <h2 className={styles.mobileSectionTitle}>Behind The Scenes</h2>
          <div className={styles.mobileHeaderLine} />
        </div>
        
        <div className={styles.mobileVideoDescription}>
          <p>Watch the artistry and craftsmanship that goes into creating each unique piece</p>
        </div>
        
        <div className={styles.mobileVideoContainer} ref={videoContainerRef}>
          <div className={styles.mobileVideoCard}>
            <video
              ref={videoRef}
              className={styles.mobileVideo}
              playsInline
              loop
              autoPlay
              muted={isMuted}
              poster="/images/loading.png"
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* Video Controls - only mute/unmute */}
            <div className={styles.videoControls}>
              <button 
                className={styles.muteButton} 
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.mobileVideoFooter}>
          <p>Experience the magic of resin art creation</p>
          <Link href="/products" className={styles.mobileExploreButton}>
            Explore Our Process
          </Link>
        </div>
      </section>
    );
  };

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

  useEffect(() => {
    console.log('Current path:', pathname);
    console.log('Is product page:', isProductPage);
    console.log('Is transparent navbar:', isTransparentNavbar);
  }, [pathname, isProductPage, isTransparentNavbar]);

  // Handle back button click
  const handleBackClick = () => {
    router.back();
  };
  
  // Handle share button click for product pages
  const handleShareProduct = () => {
    // This will be handled by the product page itself
    // We're just dispatching a custom event that the product page can listen for
    const shareEvent = new CustomEvent('shareProduct');
    window.dispatchEvent(shareEvent);
  };

  // Get product name for product pages
  useEffect(() => {
    if (isProductPage) {
      const productId = pathname?.split('/').pop();
      if (productId) {
        fetch(`/api/products/${productId}`)
          .then(res => res.json())
          .then(data => {
            if (data.product?.name) {
              setProductName(data.product.name);
            }
          })
          .catch(err => console.error('Error fetching product name:', err));
      }
    }
  }, [isProductPage, pathname]);

  return (
    <div className={`${styles.mobileLayoutContainer} ${isProductPage ? styles.productPageContainer : ''}`}>
      {/* Backdrop for account dropdown */}
      {isAccountDropdownOpen && (
        <div className={styles.mobileBackdrop} onClick={() => setIsAccountDropdownOpen(false)}></div>
      )}
      
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
                src="https://ik.imagekit.io/4pjvf8k9u/Videos/homepage4.mp4?updatedAt=1753532187691" 
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
              
              {/* Discover All Pieces Button */}
              <div className={styles.mobileDiscoverButtonContainer}>
                <button 
                  onClick={() => router.push('/products')}
                  className={styles.mobileDiscoverButton}
                >
                  <span className={styles.mobileDiscoverButtonText}>Discover All Pieces</span>
                </button>
              </div>
              
              {/* Scroll indicator */}
              <div className={styles.scrollIndicator}>
                <ChevronDown size={30} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header - Now with product page detection */}
      <header 
        className={`${styles.mobileHeader} ${isHomePage ? styles.homeMobileHeader : ''} ${isProductPage ? styles.productPageHeader : ''}`}
        data-scrolled={isScrolled ? 'true' : 'false'}
      >
        {/* Left side - Logo or Back button for product pages */}
        {isProductPage ? (
          <button 
            onClick={handleBackClick}
            className={styles.backButton}
            aria-label="Go back"
          >
            <ArrowLeft size={24} strokeWidth={2} />
          </button>
        ) : (
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
        )}
        
        {/* Center - Empty spacer or Product title for product pages */}
        <div className={styles.headerSpacer}>
          {isProductPage && productName && (
            <div className={styles.productPageTitle}>{productName}</div>
          )}
        </div>
        
        {/* Right side - Icons and burger menu */}
        <div className={styles.headerIcons}>
          {/* Share button - Only on product pages */}
          {isProductPage && (
            <button 
              onClick={handleShareProduct}
              className={styles.headerIconButton}
              aria-label="Share product"
            >
              <Share size={20} strokeWidth={2} />
            </button>
          )}
          
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
      <main className={`${styles.mobileContent} ${isHomePage ? styles.homeContent : ''}`}>
        {children}
      </main>
      
      {/* Simple Black Footer - Appears on all mobile pages */}
      <div style={{
        width: '100%',
        backgroundColor: '#000',
        padding: '40px 0',
        marginTop: '20px'
      }}>
        {/* This is an empty black footer */}
      </div>
      
      {/* Mobile Footer Navigation */}
      <nav className={`${styles.mobileFooter} ${isFooterVisible ? styles.footerVisible : styles.footerHidden}`}>
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
              style={{ 
                animation: isAccountDropdownOpen ? `${styles.slideUp} 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards` : 
                  `${styles.slideDown} 0.25s cubic-bezier(0.4, 0.0, 0.2, 1) forwards`
              }}
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
        <MobileSearchModal
          open={isSearchOpen}
          onClose={closeSearch}
        />
      )}

      {/* Mobile Bottom Navigation removed as we're using the footer instead */}
    </div>
  )
} 