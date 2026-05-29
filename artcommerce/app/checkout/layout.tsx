export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-shell min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}
