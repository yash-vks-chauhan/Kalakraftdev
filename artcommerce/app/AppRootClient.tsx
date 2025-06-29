'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from './components/Navbar'
import NotificationContainer from './components/NotificationContainer'
import AdminNotifications from './components/AdminNotifications'
import Providers from './Providers'
import { useMobileMenu } from './contexts/MobileMenuContext'
import MobileMenuPanel from './components/MobileMenuPanel'
import ErrorBoundary from './components/ErrorBoundary'
import styles from './components/Navbar.module.css'

export default function AppRootClient({ children }: { children: React.ReactNode }) {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)

  // Handle client-side initialization
  useEffect(() => {
    setIsClient(true)
  }, [])

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

  // Show a loading state during SSR
  if (!isClient) {
    return (
      <body suppressHydrationWarning>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#fff'
        }}>
          <div style={{
            textAlign: 'center',
            fontSize: '16px',
            color: '#666'
          }}>
            Loading...
          </div>
        </div>
      </body>
    )
  }

  return (
    <body suppressHydrationWarning>
      <ErrorBoundary>
        <Providers>
          {/* New dedicated background blur layer, now inside Providers but sibling to content */}
          {isMobileMenuOpen && <div className={`${styles.mobileBackgroundBlur} ${styles.active}`}></div>}

          {/* Main content wrapper - now correctly blurred */}
          <div className={isMobileMenuOpen ? styles.mainContentBlurred : ''}>
            <Navbar />
            <NotificationContainer />
            <AdminNotifications />
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>

          {/* Mobile Menu Overlay - rendered as sibling to content */}
          <div 
            className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.active : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          ></div>

          {/* Mobile Menu Panel - rendered as sibling to content */}
          <MobileMenuPanel />
        </Providers>
      </ErrorBoundary>
    </body>
  );
} 