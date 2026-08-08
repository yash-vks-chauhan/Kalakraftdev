'use client'

import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { WishlistProvider } from './contexts/WishlistContext'
import { MobileMenuProvider } from './contexts/MobileMenuContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { FirebaseAuthProvider } from './contexts/FirebaseAuthContext'
import { AppModeProvider } from './contexts/ModeContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AuthProvider>
        {/* Reads the role, so it has to sit inside AuthProvider. */}
        <AppModeProvider>
          <MobileMenuProvider>
            <CartProvider>
              <WishlistProvider>
                <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
              </WishlistProvider>
            </CartProvider>
          </MobileMenuProvider>
        </AppModeProvider>
      </AuthProvider>
    </NotificationProvider>
  )
}