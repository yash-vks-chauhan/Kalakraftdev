import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile User Management | Admin Dashboard',
  description: 'Manage users and permissions in mobile-optimized interface',
}

export default function MobileUsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
