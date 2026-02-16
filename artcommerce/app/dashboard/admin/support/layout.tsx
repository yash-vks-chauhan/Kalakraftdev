// File: app/dashboard/admin/support/layout.tsx
'use client';
import AdminLayout from '../layout';

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}