import React from 'react';

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if the user agent indicates a mobile device
  const userAgent = window.navigator.userAgent.toLowerCase();
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|windows phone/i;
  
  // Check if the screen width is typical for mobile devices
  const isMobileWidth = window.innerWidth <= 768;
  
  return mobileRegex.test(userAgent) || isMobileWidth;
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