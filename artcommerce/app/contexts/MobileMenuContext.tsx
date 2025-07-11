'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface MobileMenuContextType {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isProductPage: boolean;
  isTransparentNavbar: boolean;
}

const MobileMenuContext = createContext<MobileMenuContextType>({
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: () => {},
  isProductPage: false,
  isTransparentNavbar: false,
});

export const useMobileMenu = () => useContext(MobileMenuContext);

export const MobileMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // Check if current page is a product details page
  // This regex matches paths like /products/123 but not /products or /products/new
  const isProductPage = pathname ? /^\/products\/\d+$/.test(pathname) : false;
  
  // Determine if navbar should be transparent (on product pages)
  const isTransparentNavbar = isProductPage;
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);
  
  return (
    <MobileMenuContext.Provider value={{ 
      isMobileMenuOpen, 
      setIsMobileMenuOpen,
      isProductPage,
      isTransparentNavbar
    }}>
      {children}
    </MobileMenuContext.Provider>
  );
}; 