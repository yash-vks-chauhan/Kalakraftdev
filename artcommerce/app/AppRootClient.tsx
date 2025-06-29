'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from './components/Navbar'
import NotificationContainer from './components/NotificationContainer'
import AdminNotifications from './components/AdminNotifications'
import Providers from './Providers'
import { useMobileMenu } from './contexts/MobileMenuContext'
import MobileMenuPanel from './components/MobileMenuPanel'
import MobileLayout from './components/MobileLayout'
import styles from './components/Navbar.module.css'

export default function AppRootClient({ children }: { children: React.ReactNode }) {
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
      
      const userAgent = window.navigator.userAgent.toLowerCase();
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|windows phone/i;
      const isMobileWidth = window.innerWidth <= 768;
      setIsMobile(mobileRegex.test(userAgent) || isMobileWidth);
      setIsSmallScreen(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

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

            {/* Mobile Menu Panel */}
            <MobileMenuPanel />
            
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