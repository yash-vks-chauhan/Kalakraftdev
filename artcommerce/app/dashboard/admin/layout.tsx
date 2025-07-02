// File: app/dashboard/admin/layout.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const hideNav = [
    '/dashboard/admin/products',
    '/dashboard/admin/users',
    '/dashboard/admin/orders',
    '/dashboard/admin/support'
  ].some(prefix => path.startsWith(prefix));

  if (hideNav) {
    return (
      <main className={styles.adminContent}>{children}</main>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.adminNav}>
        <nav className={styles.adminNavLinks}>
          <Link href="/dashboard/admin" className={`${styles.adminNavLink} ${path === '/dashboard/admin' ? styles.active : ''}`}>
            Home
          </Link>
          <Link
            href="/dashboard/admin/orders"
            className={`${styles.adminNavLink} ${path.startsWith('/dashboard/admin/orders') ? styles.active : ''}`}
          >
            Orders
          </Link>
          <Link
            href="/dashboard/admin/wishlist"
            className={`${styles.adminNavLink} ${path.startsWith('/dashboard/admin/wishlist') ? styles.active : ''}`}
          >
            Wishlist
          </Link>
          <Link
            href="/dashboard/admin/support"
            className={`${styles.adminNavLink} ${path.startsWith('/dashboard/admin/support') ? styles.active : ''}`}
          >
            Support
          </Link>
          <Link
            href="/dashboard/admin/reviews"
            className={`${styles.adminNavLink} ${path.startsWith('/dashboard/admin/reviews') ? styles.active : ''}`}
          >
            Reviews
          </Link>
        </nav>
      </aside>
      <main className={styles.adminContent}>
        {children}
      </main>
    </div>
  );
}
