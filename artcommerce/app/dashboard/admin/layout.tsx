// File: app/dashboard/admin/layout.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
      <main className="p-6">{children}</main>
    );
  }

  return (
    <div className="admin-container flex">
      <aside className="admin-nav w-60 p-4 border-r">
        <nav className="space-y-2">
          <Link href="/dashboard/admin" className={path === '/dashboard/admin' ? 'font-bold' : ''}>
            Home
          </Link>
          <Link
            href="/dashboard/admin/orders"
            className={path.startsWith('/dashboard/admin/orders') ? 'font-bold' : ''}
          >
            Orders
          </Link>
          <Link
            href="/dashboard/admin/wishlist"
            className={path.startsWith('/dashboard/admin/wishlist') ? 'font-bold' : ''}
          >
            Wishlist
          </Link>
          <Link
            href="/dashboard/admin/support"
            className={path.startsWith('/dashboard/admin/support') ? 'font-bold' : ''}
          >
            Support
          </Link>
          <Link
            href="/dashboard/admin/reviews"
            className={path.startsWith('/dashboard/admin/reviews') ? 'font-bold' : ''}
          >
            Reviews
          </Link>
        </nav>
      </aside>
      <main className="admin-content flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
