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
        <link rel="preload" href="/images/featured1.png" as="image" />
        <link rel="preload" href="/images/featured2.png" as="image" />
        <link rel="preload" href="/images/featured3.JPG" as="image" />
        <style>{`
          /* Global styles for the layout */
        `}</style>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover, shrink-to-fit=no" />
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
        {/* Inline global error hook to surface client errors even if hydration fails */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              function show(msg, stack){
                try{var b=document.createElement('div');
                b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#fee2e2;color:#991b1b;padding:8px 12px;font-size:12px;border-bottom:1px solid #ef4444;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial';
                b.textContent='Client error: '+msg+(stack?(' — '+String(stack).split('\n')[0]):''); (document.body||document.documentElement).appendChild(b);}catch(e){}
              }
              window.addEventListener('error',function(e){show((e&&e.error&&e.error.message)||e.message||'Unknown error', e&&e.error&&e.error.stack)});
              window.addEventListener('unhandledrejection',function(e){var r=e&&e.reason; show((r&& (r.message||r.toString&&r.toString()))||'Unhandled promise rejection', r&&r.stack)});
            })();`
          }}
        />
      </head>
      <body>
        <MobileMenuProvider>
          <AppRootClient>{children}</AppRootClient>
        </MobileMenuProvider>
      </body>
    </html>
  )
}