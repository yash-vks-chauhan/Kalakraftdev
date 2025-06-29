'use client'

import React from 'react'
import Link from 'next/link'
import { Instagram, Facebook, Twitter, Mail, Phone } from 'lucide-react'
import styles from './mobile.module.css'

export default function MobileFooter() {
  return (
    <footer className={styles.mobileFooter}>
      <div className={styles.footerSection}>
        <h3 className={styles.footerTitle}>Quick Links</h3>
        <div className={styles.footerLinks}>
          <Link href="/products" className={styles.footerLink}>
            All Products
          </Link>
          <Link href="/support" className={styles.footerLink}>
            Support
          </Link>
          <Link href="/dashboard/orders" className={styles.footerLink}>
            Track Order
          </Link>
        </div>
      </div>
      
      <div className={styles.footerSection}>
        <h3 className={styles.footerTitle}>Connect With Us</h3>
        <div className={styles.socialLinks}>
          <a href="#" className={styles.socialLink} aria-label="Instagram">
            <Instagram size={20} />
          </a>
          <a href="#" className={styles.socialLink} aria-label="Facebook">
            <Facebook size={20} />
          </a>
          <a href="#" className={styles.socialLink} aria-label="Twitter">
            <Twitter size={20} />
          </a>
        </div>
      </div>
      
      <div className={styles.footerSection}>
        <h3 className={styles.footerTitle}>Contact</h3>
        <div className={styles.contactInfo}>
          <a href="mailto:info@artcommerce.com" className={styles.contactLink}>
            <Mail size={16} />
            <span>info@artcommerce.com</span>
          </a>
          <a href="tel:+1234567890" className={styles.contactLink}>
            <Phone size={16} />
            <span>+1 (234) 567-890</span>
          </a>
        </div>
      </div>
      
      <div className={styles.footerBottom}>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} Artcommerce. All rights reserved.
        </p>
      </div>
    </footer>
  )
} 