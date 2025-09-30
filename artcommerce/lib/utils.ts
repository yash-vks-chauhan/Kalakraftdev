import React from 'react';

/**
 * Checks if the current device is a mobile device based on user agent and screen size
 * @returns boolean - true if the current device is mobile
 */
export function isMobileDevice(): boolean {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    // Check user agent for common mobile device identifiers
    const userAgent = window.navigator.userAgent.toLowerCase();
    
    // Check for mobile devices (phones and small tablets)
    const isMobileUserAgent = /android|webos|iphone|ipod|blackberry|windows phone/.test(userAgent);
    
    // Enhanced iPad detection
    const isIPad = /ipad/.test(userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                  (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    
    // Check for touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Use 768px as the breakpoint for mobile devices (excluding large tablets)
    const isMobileScreenSize = window.innerWidth <= 768;
    
    // Use 1024px for tablets (including iPad)
    const isTabletScreenSize = window.innerWidth <= 1024 && window.innerWidth > 768;
    
    // Mobile: phones and small screens
    if (isMobileUserAgent || isMobileScreenSize) {
      return true;
    }
    
    // Tablet: iPad and other tablets should be treated as mobile for UI purposes
    if (isIPad || (isTouchDevice && isTabletScreenSize)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error in isMobileDevice:', error);
    // Fallback to basic screen size check
    return window.innerWidth <= 1024;
  }
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };
    
    // Check on initial load and when window is resized
    checkMobile();
    setIsInitialized(true);
    
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Return false until initialized to prevent hydration mismatch
  return isInitialized ? isMobile : false;
} 