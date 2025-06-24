'use client'

import React, { useEffect } from 'react'
import Navbar from './Navbar'
import AdminNotifications from './AdminNotifications'
import Providers from '../Providers'
import { useMobileMenu } from '../contexts/MobileMenuContext'

export default function LayoutClientContent({ children }: { children: React.ReactNode }) {
  const { isMobileMenuOpen } = useMobileMenu();

  useEffect(() => {
    // Interactive light effect for product grid section
    const productGridSection = document.querySelector('.productGridSection') as HTMLElement | null;
    const lightEffect = document.querySelector('.lightEffect');
    
    if (productGridSection && !lightEffect) {
      // Create light effect element if it doesn't exist
      const newLightEffect = document.createElement('div');
      newLightEffect.className = 'lightEffect';
      productGridSection.appendChild(newLightEffect);
      
      // Add mouse move event listener
      productGridSection.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = productGridSection.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Update CSS variables for the light position
        productGridSection.style.setProperty('--x-position', `${x}px`);
        productGridSection.style.setProperty('--y-position', `${y}px`);
      });
      
      // Add watercolor splash elements
      const splash1 = document.createElement('div');
      splash1.className = 'watercolorSplash';
      productGridSection.appendChild(splash1);
      
      const splash2 = document.createElement('div');
      splash2.className = 'watercolorSplash2';
      productGridSection.appendChild(splash2);
      
      // Add black ink splash
      const inkSplash = document.createElement('div');
      inkSplash.className = 'inkSplash';
      productGridSection.appendChild(inkSplash);
      
      // Add scroll indicator
      const scrollIndicator = document.createElement('div');
      scrollIndicator.className = 'scrollDownIndicator';
      
      const arrow1 = document.createElement('div');
      arrow1.className = 'scrollArrow';
      
      const arrow2 = document.createElement('div');
      arrow2.className = 'scrollArrow';
      
      scrollIndicator.appendChild(arrow1);
      scrollIndicator.appendChild(arrow2);
      
      productGridSection.appendChild(scrollIndicator);
      
      // Add brush accent
      const brushAccent = document.createElement('div');
      brushAccent.className = 'brushAccent';
      productGridSection.appendChild(brushAccent);
      
      // Add section separator
      const sectionSeparator = document.createElement('div');
      sectionSeparator.className = 'sectionSeparator';
      
      // Append after the product grid section
      if (productGridSection.parentNode) {
        productGridSection.parentNode.insertBefore(sectionSeparator, productGridSection.nextSibling);
      }
    }
  }, []);

  return (
    <body className={isMobileMenuOpen ? 'bodyBlurred' : ''} suppressHydrationWarning>
      <Providers>
        <Navbar />
        <AdminNotifications />
        {children}
      </Providers>
    </body>
  );
} 