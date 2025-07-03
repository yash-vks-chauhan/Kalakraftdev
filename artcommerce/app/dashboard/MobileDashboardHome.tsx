"use client"

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import styles from './mobile-dashboard.module.css'

export default function MobileDashboardHome() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className={styles.mobileDashboardContainer}>
      <h1 className={styles.mobileHeader}>Dashboard</h1>
      <ul className={styles.menuList}>
        <li>
          <Link href="/dashboard/profile" className={styles.menuItem}>
            <span className={styles.menuItemText}>Profile Settings</span>
            <ChevronRight size={20} />
          </Link>
        </li>
        <li>
          <Link href="/dashboard/orders" className={styles.menuItem}>
            <span className={styles.menuItemText}>Your Orders</span>
            <ChevronRight size={20} />
          </Link>
        </li>
        {/* Admin specific entries */}
        {user.role === 'admin' && (
          <>
            <li>
              <Link href="/dashboard/admin/orders" className={styles.menuItem}>
                <span className={styles.menuItemText}>All Orders</span>
                <ChevronRight size={20} />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/products" className={styles.menuItem}>
                <span className={styles.menuItemText}>Manage Products</span>
                <ChevronRight size={20} />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/users" className={styles.menuItem}>
                <span className={styles.menuItemText}>User Management</span>
                <ChevronRight size={20} />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/coupons" className={styles.menuItem}>
                <span className={styles.menuItemText}>Coupon Manager</span>
                <ChevronRight size={20} />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/products/low-stock" className={styles.menuItem}>
                <span className={styles.menuItemText}>Low-Stock</span>
                <ChevronRight size={20} />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/support" className={styles.menuItem}>
                <span className={styles.menuItemText}>Support Tickets</span>
                <ChevronRight size={20} />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/reviews" className={styles.menuItem}>
                <span className={styles.menuItemText}>Reviews & Ratings</span>
                <ChevronRight size={20} />
              </Link>
            </li>
          </>
        )}
        <li>
          <Link href="/dashboard/cart" className={styles.menuItem}>
            <span className={styles.menuItemText}>Your Cart</span>
            <ChevronRight size={20} />
          </Link>
        </li>
        <li>
          <Link href="/dashboard/wishlist" className={styles.menuItem}>
            <span className={styles.menuItemText}>Your Wishlist</span>
            <ChevronRight size={20} />
          </Link>
        </li>
      </ul>
    </div>
  )
} 