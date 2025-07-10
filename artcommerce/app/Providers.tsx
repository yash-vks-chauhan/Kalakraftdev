'use client'

import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { WishlistProvider } from './contexts/WishlistContext'
import { MobileMenuProvider } from './contexts/MobileMenuContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { FirebaseAuthProvider } from './contexts/FirebaseAuthContext'
import { DarkModeProvider } from './contexts/DarkModeContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AuthProvider>
        <MobileMenuProvider>
          <DarkModeProvider>
            <CartProvider>
              <WishlistProvider>
                <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
              </WishlistProvider>
            </CartProvider>
          </DarkModeProvider>
        </MobileMenuProvider>
      </AuthProvider>
    </NotificationProvider>
  )
}