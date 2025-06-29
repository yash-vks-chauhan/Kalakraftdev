import './globals.css'
import { Inter } from 'next/font/google'
import AppRootClient from './AppRootClient'
import { MobileMenuProvider } from './contexts/MobileMenuContext'
import MobileLayout from './MobileLayout'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'Artcommerce',
  description: 'Your one-stop shop for handcrafted art pieces',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>{`
          :root {
            --cosmos-z-index: 50;
          }
          
          /* Ensure text is visible in dark backgrounds */
          .cosmos-text {
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            position: relative;
            z-index: var(--cosmos-z-index);
          }
        `}</style>
      </head>
      <MobileMenuProvider>
        <MobileLayout>
          <AppRootClient>{children}</AppRootClient>
        </MobileLayout>
      </MobileMenuProvider>
    </html>
  )
}