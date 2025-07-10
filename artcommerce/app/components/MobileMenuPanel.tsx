'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { useMobileMenu } from '../contexts/MobileMenuContext'
import { useDarkMode } from '../contexts/DarkModeContext'
import styles from './MobileLayout.module.css'
import { useRouter } from 'next/navigation'
import { isMobileDevice } from '../../lib/utils'
import { X, User, ShoppingBag, Heart, MessageCircle, Settings, Info, LogOut, Monitor, Smartphone, Moon, Sun } from 'lucide-react'

interface MobileMenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
  toggleViewMode: () => void;
  viewMode: 'mobile' | 'desktop';
}

const MobileMenuPanel: React.FC<MobileMenuPanelProps> = ({ isOpen, onClose, toggleViewMode, viewMode }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isActualMobileDevice, setIsActualMobileDevice] = useState(false);

  useEffect(() => {
    // Check if the user is on an actual mobile device
    setIsActualMobileDevice(isMobileDevice());
  }, []);

  // Navigation links configuration
  const navLinks = [
    { 
      title: 'Account', 
      icon: <User size={20} />, 
      href: user ? '/dashboard/profile' : '/auth/login',
      hideWhenLoggedOut: false
    },
    { 
      title: 'My Cart', 
      icon: <ShoppingBag size={20} />, 
      href: '/dashboard/cart',
      hideWhenLoggedOut: false
    },
    { 
      title: 'Wishlist', 
      icon: <Heart size={20} />, 
      href: '/dashboard/wishlist',
      hideWhenLoggedOut: false
    },
    { 
      title: 'Support', 
      icon: <MessageCircle size={20} />, 
      href: '/support',
      hideWhenLoggedOut: false
    },
    { 
      title: 'Settings', 
      icon: <Settings size={20} />, 
      href: '/dashboard/settings',
      hideWhenLoggedOut: true
    },
    { 
      title: 'About Us', 
      icon: <Info size={20} />, 
      href: '/about',
      hideWhenLoggedOut: false
    },
  ];

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    router.push('/');
  };

  return (
    <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`}>
      <div className={styles.mobileMenuHeader}>
        <button 
          onClick={onClose}
          className={styles.closeMenuButton}
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className={styles.mobileMenuContent}>
        <div className={styles.mobileMenuLinks}>
          {navLinks.map((link, index) => (
            ((!link.hideWhenLoggedOut || user) && (
              <button 
                key={index}
                onClick={() => handleNavigate(link.href)}
                className={styles.mobileNavLink}
              >
                {link.icon}
                <span>{link.title}</span>
              </button>
            ))
          ))}
          
          {/* Dark Mode Toggle - Only show for admin users */}
          {user?.role === 'admin' && (
            <button 
              onClick={toggleDarkMode}
              className={styles.mobileNavLink}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          )}
          
          {user && (
            <button 
              onClick={handleLogout}
              className={styles.mobileNavLink}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          )}

          {/* Only show view toggle if NOT on an actual mobile device */}
          {!isActualMobileDevice && (
            <button 
              onClick={toggleViewMode}
              className={styles.mobileNavLink}
            >
              {viewMode === 'mobile' ? <Monitor size={20} /> : <Smartphone size={20} />}
              <span>Switch to {viewMode === 'mobile' ? 'Desktop' : 'Mobile'} View</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenuPanel;