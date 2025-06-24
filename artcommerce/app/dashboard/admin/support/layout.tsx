// File: app/dashboard/admin/support/layout.tsx
'use client';
import AdminLayout from '../layout';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <AdminLayout>
      <nav className="flex space-x-4 border-b pb-2 mb-4">
        <Link
          href="/dashboard/admin/support"
          className={path === '/dashboard/admin/support' ? 'font-bold' : ''}
        >
          All Tickets
        </Link>
      </nav>
      {children}
    </AdminLayout>
  );
}