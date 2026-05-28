// Admin pages now inherit navigation from the dashboard shell sidebar.
// This layout exists as a pass-through so the route group remains intact.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
