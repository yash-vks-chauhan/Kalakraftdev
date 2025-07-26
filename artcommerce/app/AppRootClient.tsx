'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from './components/Navbar'
import NotificationContainer from './components/NotificationContainer'
import AdminNotifications from './components/AdminNotifications'
import Providers from './Providers'
import { useMobileMenu } from './contexts/MobileMenuContext'
import MobileMenuPanel from './components/MobileMenuPanel'
import MobileLayout from './components/MobileLayout'
import styles from './components/Navbar.module.css'
import { isMobileDevice } from '../lib/utils'
import { getImageUrl, getOptimizedImageUrl } from '../lib/cloudinaryImages'

export default function AppRootClient({ children }: { children: React.ReactNode }) {
  // Skip automatic scroll on initial load
  const isFirstPathRef = useRef(true);
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [forceDesktopView, setForceDesktopView] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Check if device is mobile on client side
  useEffect(() => {
    const checkMobile = () => {
      // Check if user has a preference saved
      const savedViewPreference = localStorage.getItem('viewPreference');
      if (savedViewPreference === 'desktop') {
        setForceDesktopView(true);
        return;
      }
      
      // Use the utility function for mobile detection
      setIsMobile(isMobileDevice());
      setIsSmallScreen(window.innerWidth <= 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Scroll to top on route change, but not on initial mount or when going to products from home
  useEffect(() => {
    if (isFirstPathRef.current) {
      isFirstPathRef.current = false;
      return;
    }
    
    // Don't scroll to top when navigating from home to products
    const isNavigatingToProductsFromHome = pathname === '/products' && 
      sessionStorage.getItem('lastPath') === '/';
    
    if (!isNavigatingToProductsFromHome) {
      window.scrollTo(0, 0);
    }
    
    // Store current path for next navigation
    sessionStorage.setItem('lastPath', pathname);
  }, [pathname]);

  // Swap favicon for dark/light mode in Chromium browsers
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateFavicon = () => {
      const link = document.getElementById('favicon') as HTMLLinkElement | null;
      if (!link) return;
      link.href = mediaQuery.matches
        ? getOptimizedImageUrl('logo.png', 'e_negate')
        : getImageUrl('logo.png');
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateFavicon);
    } else {
      mediaQuery.addListener(updateFavicon);
    }
    updateFavicon();
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateFavicon);
      } else {
        mediaQuery.removeListener(updateFavicon);
      }
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).dataset.startX = e.touches[0].clientX.toString();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const startX = parseFloat(((e.currentTarget as HTMLElement).dataset.startX) || '0');
    const endX = e.changedTouches[0].clientX;
    const threshold = 50; // Minimum swipe distance to trigger close

    if (isMobileMenuOpen && (endX - startX) > threshold) {
      setIsMobileMenuOpen(false); // Close menu on swipe right
    }
  };

  const switchToDesktopView = () => {
    setForceDesktopView(true);
    localStorage.setItem('viewPreference', 'desktop');
  };

  const switchToMobileView = () => {
    setForceDesktopView(false);
    localStorage.setItem('viewPreference', 'mobile');
    setIsMobile(true);
  };

  // Show desktop view if forced or not mobile
  const showDesktopView = forceDesktopView || !isMobile;

  return (
    <body suppressHydrationWarning>
      <Providers>
        {!showDesktopView ? (
          // Mobile Layout
          <MobileLayout onSwitchToDesktop={switchToDesktopView}>{children}</MobileLayout>
        ) : (
          // Desktop Layout
          <>
            {/* Background blur layer for mobile menu */}
        {isMobileMenuOpen && <div className={`${styles.mobileBackgroundBlur} ${styles.active}`}></div>}

            {/* Main content wrapper */}
        <div className={isMobileMenuOpen ? styles.mainContentBlurred : ''}>
          <Navbar />
          <NotificationContainer />
          <AdminNotifications />
          {children}
        </div>

            {/* Mobile Menu Overlay */}
        <div 
          className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.active : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        ></div>

            {/* Mobile Menu Panel - Only used when in desktop mode but showing mobile menu */}
            <MobileMenuPanel 
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
              toggleViewMode={switchToMobileView}
              viewMode="desktop"
            />
            
            {/* Mobile View Switch Button (only show on small screens) */}
            {isSmallScreen && (
              <button 
                onClick={switchToMobileView}
                className={styles.switchToMobileButton}
                aria-label="Switch to Mobile View"
              >
                Mobile View
              </button>
            )}
          </>
        )}
      </Providers>
    </body>
  );
} 