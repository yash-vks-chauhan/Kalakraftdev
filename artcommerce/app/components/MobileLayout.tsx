'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useWishlist } from '../contexts/WishlistContext'
import { Home, ShoppingBag, User, Menu, X, Heart, Monitor, ChevronDown, Grid, HelpCircle, LogOut, ArrowLeft, Share, Save, Search } from 'lucide-react'
import { useMobileMenu } from '../contexts/MobileMenuContext'
import { getImageUrl } from '../../lib/cloudinaryImages'
import { cn } from '@/lib/utils'
import { CommandPalette } from './mobile/CommandPalette'
import styles from './MobileLayout.module.css'

interface MobileLayoutProps {
  children: React.ReactNode
  onSwitchToDesktop: () => void
}

export default function MobileLayout({ children, onSwitchToDesktop }: MobileLayoutProps) {
  const { user, logout } = useAuth()
  const { wishlistItems } = useWishlist()
  const { isMobileMenuOpen, setIsMobileMenuOpen, isProductPage, isTransparentNavbar, isCreateProductPage } = useMobileMenu()
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isProductsPage = pathname === '/products' || pathname.startsWith('/products?')
  const [isScrolled, setIsScrolled] = useState(false)
  // The header flips from transparent to solid past the hero, not at 10px —
  // on the homepage it sits over a 424px dark block.
  const [pastHero, setPastHero] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  // Transparent only where there is a dark hero to sit on.
  const onDark = isHomePage && !pastHero
  const solidHeader = !onDark
  const [isFooterVisible, setIsFooterVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [rotatingText, setRotatingText] = useState('coasters')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isHeroVideoLoaded, setIsHeroVideoLoaded] = useState(false)
  const [hasHeroVideoError, setHasHeroVideoError] = useState(false)
  const [heroVideoSourceIndex, setHeroVideoSourceIndex] = useState(0)
  const router = useRouter()
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  const accountDropdownRef = useRef<HTMLDivElement>(null)
  const [productName, setProductName] = useState<string>('')
  const [isRouteLoading, setIsRouteLoading] = useState(false)
  const heroVideoSources = [
    'https://ik.imagekit.io/4pjvf8k9u/Videos/homepage4.mp4?updatedAt=1753532187691',
    '/images/homepage4.mp4',
    '/images/homepage.mp4',
  ]

  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile')

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

  const textOptions = ['coasters', 'clocks', 'trays', 'wall art', 'home decor']

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false)
      }
    }
    
    if (isAccountDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAccountDropdownOpen, accountDropdownRef])

  useEffect(() => {
    setIsAccountDropdownOpen(false)
  }, [user])

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
      
      scrollVelocity = Math.abs(currentScrollY - prevScrollY) / Math.max(timeDiff, 1)
      
      setIsScrolled(currentScrollY > 10)
      setPastHero(currentScrollY > 368)
      
      const currentDirection = currentScrollY > prevScrollY ? 1 : -1
      
      if (currentDirection !== scrollDirection) {
        scrollDirection = currentDirection
      }
      
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }
      
      // Unified footer visibility logic for all pages
      if (currentScrollY < 50) {
        setIsFooterVisible(true)
      } else if (
        scrollDirection > 0 &&
        scrollVelocity > 0.3 &&
        currentScrollY > 100
      ) {
        setIsFooterVisible(false)
      } else if (scrollDirection < 0) {
        setIsFooterVisible(true)
      }
      
      // Show footer after scrolling stops
      scrollTimer = setTimeout(() => {
        if (currentScrollY > 50) {
          setIsFooterVisible(true)
        }
      }, 150)
      
      prevScrollY = currentScrollY
      lastScrollTime = currentTime
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }
    }
  }, [lastScrollY])

  useEffect(() => {
    let currentIndex = 0
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % textOptions.length
      setRotatingText(textOptions[currentIndex])
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

  const handleHeroVideoLoaded = (event: any) => {
    setIsHeroVideoLoaded(true)
    setHasHeroVideoError(false)

    const playPromise = event.currentTarget?.play?.()
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // If autoplay is blocked, keep the decoded frame visible.
      })
    }
  }

  const handleHeroVideoError = () => {
    if (heroVideoSourceIndex < heroVideoSources.length - 1) {
      setHeroVideoSourceIndex((prev) => prev + 1)
      setIsHeroVideoLoaded(false)
      setHasHeroVideoError(false)
      return
    }

    setHasHeroVideoError(true)
    setIsHeroVideoLoaded(false)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleProductsClick = () => {
    router.push('/products');
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }

  const handleWishlistClick = () => {
    router.push('/dashboard/wishlist');
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
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
    
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
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
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight - 60,
      behavior: 'smooth'
    });
  };

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

  const MobileVideoSection = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    
    const videoUrl = process.env.NEXT_PUBLIC_INSTAGRAM_VIDEO_URL || "https://res.cloudinary.com/downe8107/video/upload/v1752756632/Goal_make_the_202507170106_9lp5g_rosxzs.mp4";
    
    useEffect(() => {
      const videoContainer = videoContainerRef.current;
      if (!videoContainer || !videoRef.current) return;
      
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
        { threshold: 0.3 }
      );
      
      observer.observe(videoContainer);
      
      return () => {
        observer.unobserve(videoContainer);
      };
    }, []);
    
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

  useEffect(() => {
    console.log('Current path:', pathname);
    console.log('Is product page:', isProductPage);
    console.log('Is transparent navbar:', isTransparentNavbar);
    if (isRouteLoading) {
      const t = setTimeout(() => setIsRouteLoading(false), 300)
      return () => clearTimeout(t)
    }
  }, [pathname, isProductPage, isTransparentNavbar]);

  const handleBackClick = () => {
    router.back();
  };
  
  const handleShareProduct = () => {
    const shareEvent = new CustomEvent('shareProduct');
    window.dispatchEvent(shareEvent);
  };

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
      {isRouteLoading && (
        <div className="fixed inset-0 z-[1000] bg-white/90 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-3 text-black">
            <span className="h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin"></span>
            <span className="text-sm font-medium tracking-wide">Loading…</span>
          </div>
        </div>
      )}
      {/* Backdrop for account dropdown */}
      {isAccountDropdownOpen && (
        <div className={styles.mobileBackdrop} onClick={() => setIsAccountDropdownOpen(false)}></div>
      )}
      
      {/* Home page specific content - Put at the top */}
      {/*
        The homepage hero used to live here — a full-screen autoplaying video
        card with its own logo and CTA. It now belongs to the page itself
        (components/home/mobile/HeroPour), so the layout stops competing with
        its own content and the video is no longer on the critical path.
      */}

      {/*
        Mobile header — two decisive states.

        Over the homepage hero it is fully transparent with white content; past
        the hero (and on every other page) it becomes a frosted surface with a
        hairline and dark content. The previous version faded in at
        rgba(255,255,255,0.1), which over a near-white page read as no change,
        and left its right-hand two thirds empty on the homepage.
      */}
      {/*
        The product page owns its chrome now: the piece runs full bleed to the
        top of the screen and back / save / share float over it as glass
        buttons. Rendering this bar there too gave every product two back
        buttons and pushed the image down behind a solid strip.
      */}
      {!isProductPage && (
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[1001] pt-safe transition-[background-color,border-color,box-shadow] duration-300',
          'border-b',
          solidHeader
            ? 'border-border bg-background/[0.86] backdrop-blur-xl backdrop-saturate-150'
            : 'border-transparent bg-transparent'
        )}
        data-scrolled={isScrolled ? 'true' : 'false'}
      >
        <div className="flex h-14 items-center gap-1 pl-4 pr-2">
          {isProductPage || isCreateProductPage ? (
            <button
              onClick={isProductPage ? handleBackClick : () => router.push('/dashboard/admin/products')}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                onDark ? 'text-white' : 'text-foreground'
              )}
              aria-label="Go back"
            >
              <ArrowLeft size={22} strokeWidth={2} />
            </button>
          ) : (
            <Link
              href="/"
              className={cn(
                'flex h-11 items-center font-serif text-[21px] italic leading-none tracking-[-0.01em] transition-colors',
                onDark ? 'text-white' : 'text-foreground'
              )}
            >
              kalakraft
            </Link>
          )}

          {(isProductPage || isCreateProductPage) && (
            <span
              className={cn(
                'min-w-0 flex-1 truncate px-2 text-center text-sm font-medium',
                onDark ? 'text-white' : 'text-foreground'
              )}
            >
              {isCreateProductPage ? 'New Product' : productName}
            </span>
          )}

          <div className="ml-auto flex items-center">
            {isCreateProductPage && (
              <button
                type="submit"
                form="product-form"
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground"
                aria-label="Save product"
              >
                <Save size={20} strokeWidth={2} />
              </button>
            )}

            {isProductPage && (
              <button
                onClick={handleShareProduct}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  onDark ? 'text-white' : 'text-foreground'
                )}
                aria-label="Share product"
              >
                <Share size={20} strokeWidth={2} />
              </button>
            )}

            {!isProductPage && !isCreateProductPage && (
              <>
                {/* The field folds away on scroll, so search comes back as an icon. */}
                {(!isHomePage || pastHero) && (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      onDark ? 'text-white' : 'text-foreground'
                    )}
                    aria-label="Search"
                  >
                    <Search size={19} strokeWidth={1.9} />
                  </button>
                )}

                <Link
                  href={user ? '/dashboard/wishlist' : '/auth/login'}
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-full',
                    onDark ? 'text-white' : 'text-foreground'
                  )}
                  aria-label={
                    wishlistItems.length > 0
                      ? `Saved, ${wishlistItems.length} item${wishlistItems.length === 1 ? '' : 's'}`
                      : 'Saved'
                  }
                >
                  <Heart size={19} strokeWidth={1.9} />
                  {wishlistItems.length > 0 && (
                    <span
                      aria-hidden
                      className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-600 ring-2 ring-background"
                    />
                  )}
                </Link>

                <Link
                  href={user ? '/dashboard' : '/auth/login'}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    onDark ? 'text-white' : 'text-foreground'
                  )}
                  aria-label={user ? 'Your account' : 'Sign in'}
                >
                  <User size={19} strokeWidth={1.9} />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Home only: a real search field at rest, folded away once scrolling. */}
        {isHomePage && (
          <div
            className={cn(
              'overflow-hidden px-4 transition-[height,opacity,padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
              pastHero ? 'h-0 opacity-0' : 'h-[52px] pb-2.5 opacity-100'
            )}
          >
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-[42px] w-full items-center gap-2.5 rounded-full border border-white/25 bg-white/[0.16] px-3.5 text-left text-[13.5px] text-white/95 backdrop-blur"
            >
              <Search size={16} strokeWidth={2} className="shrink-0" />
              Search clocks, trays, rangoli&hellip;
            </button>
          </div>
        )}
      </header>
      )}

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Main Content Area */}
      <main className={`${
        isProductsPage 
          ? styles.productsPageContent 
          : styles.mobileContent
      } ${isHomePage ? styles.homeContent : ''}`}>
        {children}
      </main>
      
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
      
      {/*
        The burger and its slide-out sidebar used to live here (StaggeredMenu,
        rendered fixed so the button floated over the header icons). Both are
        gone: the dock carries navigation, the header carries search, saved and
        account, and nothing on a phone should need a second menu system.
      */}

      {/* Mobile Bottom Navigation removed as we're using the footer instead */}
    </div>
  )
} 
