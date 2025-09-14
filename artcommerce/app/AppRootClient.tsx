'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from './components/Navbar'
import AdminNotifications from './components/AdminNotifications'
import UserNotifications from './components/UserNotifications'
import Providers from './Providers'
import { useMobileMenu } from './contexts/MobileMenuContext'
import MobileMenuPanel from './components/MobileMenuPanel'
import MobileLayout from './components/MobileLayout'
import AppContentWrapper from './components/AppContentWrapper'
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
  const [globalClientError, setGlobalClientError] = useState<string | null>(null);

  // Treat certain routes as mobile-only regardless of preference
  const mobileOnlyRoutes = new Set<string>(['/cart/mobile']);
  const isMobileOnlyRoute = mobileOnlyRoutes.has(pathname);

  // Check if device is mobile on client side
  useEffect(() => {
    const checkMobile = () => {
      try {
        // Check if user has a preference saved
        const savedViewPreference = localStorage.getItem('viewPreference');
        console.log('AppRootClient: Checking mobile detection', {
          savedViewPreference,
          isMobileOnlyRoute,
          userAgent: window.navigator.userAgent,
          screenWidth: window.innerWidth
        });
        
        if (!isMobileOnlyRoute && savedViewPreference === 'desktop') {
          console.log('AppRootClient: Using saved desktop preference');
          setForceDesktopView(true);
          return;
        }
        
        // Use the utility function for mobile detection
        const mobileDetected = isMobileDevice();
        console.log('AppRootClient: Mobile detection result:', mobileDetected);
        
        setIsMobile(mobileDetected);
        setIsSmallScreen(window.innerWidth <= 1024);
        
        // If mobile detected but desktop preference exists, clear it
        if (mobileDetected && savedViewPreference === 'desktop') {
          console.log('AppRootClient: Clearing desktop preference for mobile device');
          localStorage.removeItem('viewPreference');
          setForceDesktopView(false);
        }
      } catch (error) {
        console.error('Error in mobile detection:', error);
        // Fallback to basic detection
        const fallbackMobile = window.innerWidth <= 1024;
        console.log('AppRootClient: Using fallback detection:', fallbackMobile);
        setIsMobile(fallbackMobile);
        setIsSmallScreen(fallbackMobile);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobileOnlyRoute]);

  // Global client-side error catcher (helps on mobile when app error screen hides details)
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const msg = (event?.error?.message || event?.message || 'Unknown client error').toString();
      setGlobalClientError(msg);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = (event?.reason && (event.reason.message || event.reason.toString?.())) || 'Unhandled promise rejection';
      setGlobalClientError(String(reason));
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection as any);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection as any);
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
    console.log('AppRootClient: Switching to desktop view');
    setForceDesktopView(true);
    localStorage.setItem('viewPreference', 'desktop');
  };

  const switchToMobileView = () => {
    console.log('AppRootClient: Switching to mobile view');
    setForceDesktopView(false);
    localStorage.setItem('viewPreference', 'mobile');
    setIsMobile(true);
  };

  // Show desktop view if forced or not mobile, but never on mobile-only routes
  const showDesktopView = (forceDesktopView || !isMobile) && !isMobileOnlyRoute;
  
  console.log('AppRootClient: View decision', {
    isMobile,
    forceDesktopView,
    isMobileOnlyRoute,
    showDesktopView
  });

  // Ensure mobile-only routes clear any forced desktop preference
  useEffect(() => {
    if (isMobileOnlyRoute && forceDesktopView) {
      setForceDesktopView(false);
      localStorage.setItem('viewPreference', 'mobile');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileOnlyRoute]);

  // Always use standard layout pipeline; mobile-only routes are handled via showDesktopView and MobileLayout

  return (
    <body suppressHydrationWarning>
      <Providers>
        {globalClientError && (
          <div style={{position:'fixed',top:0,left:0,right:0,zIndex:9999,background:'#fee2e2',color:'#991b1b',padding:'8px 12px',fontSize:12,borderBottom:'1px solid #ef4444'}}>
            <strong>Client error:</strong> {globalClientError}
          </div>
        )}
        
        {/* Debug panel for iPad issues */}
        {typeof window !== 'undefined' && (
          <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 99999,
            maxWidth: '300px',
            wordBreak: 'break-all'
          }}>
            <div>Mobile: {isMobile.toString()}</div>
            <div>Force Desktop: {forceDesktopView.toString()}</div>
            <div>Show Desktop: {showDesktopView.toString()}</div>
            <div>Screen: {typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px</div>
            <div>UA: {typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 50) + '...' : 'N/A'}</div>
            <button 
              onClick={switchToMobileView}
              style={{background: '#007aff', color: 'white', border: 'none', padding: '4px 8px', margin: '2px', borderRadius: '3px'}}
            >
              Mobile
            </button>
            <button 
              onClick={switchToDesktopView}
              style={{background: '#007aff', color: 'white', border: 'none', padding: '4px 8px', margin: '2px', borderRadius: '3px'}}
            >
              Desktop
            </button>
          </div>
        )}
        
        <AppContentWrapper>
          {!showDesktopView ? (
            // Mobile Layout
            <>
              <UserNotifications />
              <AdminNotifications />
              <MobileLayout onSwitchToDesktop={switchToDesktopView}>{children}</MobileLayout>
            </>
          ) : (
            // Desktop Layout
            <>
              {/* Background blur layer for mobile menu */}
          {isMobileMenuOpen && <div className={`${styles.mobileBackgroundBlur} ${styles.active}`}></div>}

              {/* Main content wrapper */}
          <div className={isMobileMenuOpen ? styles.mainContentBlurred : ''}>
            <Navbar />
            <UserNotifications />
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
              
            </>
          )}
        </AppContentWrapper>
      </Providers>
    </body>
  );
} 