import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  eyebrow: string
  title: string
  sub?: string
  action?: { href: string; label: string }
  align?: 'left' | 'center'
  dark?: boolean
  className?: string
}

// Editorial section header: small-caps eyebrow, serif title, optional
// sub-copy and a right-aligned "view all" action.
export default function SectionHeader({
  eyebrow,
  title,
  sub,
  action,
  align = 'left',
  dark = false,
  className,
}: SectionHeaderProps) {
  const centered = align === 'center'

  return (
    <div
      className={cn(
        'flex items-end justify-between gap-8',
        centered && 'flex-col items-center text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', centered && 'flex flex-col items-center')}>
        <p
          className={cn(
            'text-[11px] font-medium uppercase tracking-[0.3em]',
            dark ? 'text-white/50' : 'text-[#999]',
          )}
        >
          {eyebrow}
        </p>
        <h2
          className={cn(
            'mt-3 font-serif text-4xl font-medium leading-[1.1] xl:text-5xl',
            dark ? 'text-white' : 'text-[#1a1a1a]',
          )}
        >
          {title}
        </h2>
        {sub && (
          <p
            className={cn(
              'mt-4 max-w-xl text-[15px] leading-relaxed',
              dark ? 'text-white/60' : 'text-[#666]',
            )}
          >
            {sub}
          </p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className={cn(
            'group inline-flex shrink-0 items-center gap-1.5 pb-1 text-sm font-medium transition-colors',
            dark ? 'text-white/70 hover:text-white' : 'text-[#666] hover:text-[#1a1a1a]',
          )}
        >
          {action.label}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}
