import React from 'react';

/**
 * Checks if the current device is a mobile device based on user agent
 * @returns boolean - true if the current device is mobile
 */
export function isMobileDevice(): boolean {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Check user agent for common mobile device identifiers
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  return (
    /android|webos|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent) ||
    // Additional check for mobile screen width
    window.innerWidth < 768
  );
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