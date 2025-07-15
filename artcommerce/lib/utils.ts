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
  
  // Check user agent for common mobile device identifiers
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  // Check for mobile devices including iPad
  const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent);
  
  // Check for touch device (helps identify tablets)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Use 1024px as the breakpoint to include iPads and smaller tablets
  const isMobileScreenSize = window.innerWidth <= 1024;
  
  return isMobileUserAgent || (isTouchDevice && isMobileScreenSize);
}

export function useIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  const [isMobile, setIsMobile] = React.useState(isMobileDevice());
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };
    
    // Check on initial load and when window is resized
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  return isMobile;
} 