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
import PerformanceOptimizer from './components/PerformanceOptimizer'
import styles from './components/Navbar.module.css'
import { useDeviceDetection } from './hooks/useDeviceDetection'
import { getImageUrl, getOptimizedImageUrl } from '../lib/cloudinaryImages'

export default function AppRootClient({ children }: { children: React.ReactNode }) {
  // Skip automatic scroll on initial load
  const isFirstPathRef = useRef(true);
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  const pathname = usePathname();
  const [globalClientError, setGlobalClientError] = useState<string | null>(null);

  // Treat certain routes as mobile-only regardless of preference
  const mobileOnlyRoutes = new Set<string>(['/cart/mobile']);
  const isMobileOnlyRoute = mobileOnlyRoutes.has(pathname);

  // Routes that should bypass MobileLayout (have their own navigation).
  // All /dashboard routes own their shell now, so bypass the entire subtree.
  const bypassMobileLayoutRoutes = [
    '/dashboard',
  ];
  const shouldBypassMobileLayout = bypassMobileLayoutRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Use optimized device detection hook
  const { isMobile, forceDesktopView, isSmallScreen, switchToDesktopView, switchToMobileView } = useDeviceDetection(isMobileOnlyRoute);

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

  // Show desktop view if forced or not mobile, but never on mobile-only routes
  const showDesktopView = (forceDesktopView || !isMobile) && !isMobileOnlyRoute;

  // Dashboard routes own their own shell (sidebar) — suppress the global navbar
  const isDashboardRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  // Always use standard layout pipeline; mobile-only routes are handled via showDesktopView and MobileLayout

  return (
    <body suppressHydrationWarning>
      <Providers>
        {globalClientError && (
          <div style={{position:'fixed',top:0,left:0,right:0,zIndex:9999,background:'#fee2e2',color:'#991b1b',padding:'8px 12px',fontSize:12,borderBottom:'1px solid #ef4444'}}>
            <strong>Client error:</strong> {globalClientError}
          </div>
        )}
        
        <AppContentWrapper>
          {!showDesktopView ? (
            // Mobile Layout or Bypass
            shouldBypassMobileLayout ? (
              <>
                <UserNotifications />
                <AdminNotifications />
                {children}
              </>
            ) : (
              <>
                <UserNotifications />
                <AdminNotifications />
                <MobileLayout onSwitchToDesktop={switchToDesktopView}>{children}</MobileLayout>
              </>
            )
          ) : (
            // Desktop Layout
            <>
              {/* Background blur layer for mobile menu */}
          {isMobileMenuOpen && <div className={`${styles.mobileBackgroundBlur} ${styles.active}`}></div>}

              {/* Main content wrapper */}
          <div className={isMobileMenuOpen ? styles.mainContentBlurred : ''}>
            {!isDashboardRoute && <Navbar />}
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
        
        {/* Performance Optimizer */}
        <PerformanceOptimizer />
      </Providers>
    </body>
  );
} 