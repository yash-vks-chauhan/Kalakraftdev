import './globals.css'
import { Inter } from 'next/font/google'
import AppRootClient from './AppRootClient'
import { MobileMenuProvider } from './contexts/MobileMenuContext'
import { getImageUrl, getOptimizedImageUrl } from '../lib/cloudinaryImages'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'Kalakraft',
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link id="favicon" rel="icon" href={getImageUrl('logo.png')} />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={getImageUrl('logo.png')}
        />
        <link
          rel="mask-icon"
          href={getOptimizedImageUrl('logo.png', 'e_negate')}
          color="#000000"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href={getOptimizedImageUrl('logo.png', 'c_scale,w_192,h_192')}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href={getOptimizedImageUrl('logo.png', 'c_scale,w_512,h_512')}
        />
      </head>
      <MobileMenuProvider>
        <AppRootClient>{children}</AppRootClient>
      </MobileMenuProvider>
    </html>
  )
}