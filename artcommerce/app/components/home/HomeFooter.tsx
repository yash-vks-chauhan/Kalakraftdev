import Link from 'next/link'

const LINKS = [
  { href: '/products', label: 'Shop' },
  { href: '/#collections', label: 'Collections' },
  { href: '/#craft', label: 'Our craft' },
  { href: '/contact', label: 'Contact' },
]

// Quiet single-row close: continues the CTA band's dark material so the page
// ends in the same resin it opened with.
export default function HomeFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0908]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-10 py-8 2xl:px-4">
        <Link
          href="/"
          className="font-serif text-xl font-medium tracking-wide text-white/85 transition-colors hover:text-white"
        >
          kalakraft
        </Link>

        <nav className="flex items-center gap-8">
          {LINKS.map(link => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white/80"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-[11px] tracking-[0.08em] text-white/30">
          © {new Date().getFullYear()} Kalakraft Studio
        </p>
      </div>
    </footer>
  )
}
