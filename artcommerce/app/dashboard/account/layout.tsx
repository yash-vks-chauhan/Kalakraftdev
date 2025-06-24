// File: app/dashboard/account/layout.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="flex">
      <aside className="w-60 p-4 border-r">
        <nav className="space-y-2">
          <Link
            href="/dashboard/account"
            className={path === '/dashboard/account' ? 'font-bold' : ''}
          >
            Overview
          </Link>
          <Link
            href="/dashboard/account/orders"
            className={path.startsWith('/dashboard/account/orders') ? 'font-bold' : ''}
          >
            Orders
          </Link>
          <Link
            href="/dashboard/account/tickets"
            className={path.startsWith('/dashboard/account/tickets') ? 'font-bold' : ''}
          >
            Support Tickets
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
