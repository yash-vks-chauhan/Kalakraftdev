'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { useMobileMenu } from '../contexts/MobileMenuContext'
import styles from './Navbar.module.css' // Using Navbar.module.css for consistency

export default function MobileMenuPanel() {
  const { user, loading, logout } = useAuth();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
      <div className={styles.mobileMenuHeader}>
        <button 
          className={styles.closeButton}
          onClick={closeMobileMenu}
          aria-label="Close menu"
        >
          <span className={styles.closeIcon} />
        </button>
      </div>
      <div className={styles.mobileMenuContent}>
        <Link href="/products" className={styles.mobileLink} onClick={closeMobileMenu}>
          Products
        </Link>
        {user && (
          <Link href="/dashboard" className={styles.mobileLink} onClick={closeMobileMenu}>
            Dashboard
          </Link>
        )}
        <div className={styles.mobileAuthActions}>
          {loading ? (
            <span>Loading...</span>
          ) : user ? (
            <button 
              onClick={() => {logout(); closeMobileMenu();}} 
              className={styles.mobileAuthButton}
            >
              Sign out
            </button>
          ) : (
            <>
              <Link 
                href="/auth/login" 
                className={styles.mobileAuthButton}
                onClick={closeMobileMenu}
              >
                Log in
              </Link>
              <Link 
                href="/auth/signup" 
                className={styles.mobileAuthButton}
                onClick={closeMobileMenu}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}