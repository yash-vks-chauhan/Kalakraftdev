'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Reveal from './Reveal'

export default function CtaBand() {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    toast.success("You're on the list — new pieces land in your inbox first.")
    setEmail('')
  }

  return (
    <section className="relative overflow-hidden bg-[#1a1a1a]">
      {/* Dot-grid texture, faded toward the edges */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle,rgba(255,255,255,0.13)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]"
      />

      <div className="relative mx-auto max-w-2xl px-10 py-28 text-center">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/50">
            From the studio
          </p>
          <h2 className="mt-4 font-serif text-5xl font-medium leading-[1.1] text-white">
            Bring a piece of the studio home
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/60">
            Small batches, one-of-a-kind pours. Join the list and be first to see
            each new collection.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <form onSubmit={handleSubmit} className="mx-auto mt-9 flex max-w-md gap-3">
            <Input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Email address"
              className="h-11 border-white/15 bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:border-white/40 focus-visible:ring-white/20"
            />
            <Button
              type="submit"
              className="h-11 shrink-0 bg-white px-6 text-[#1a1a1a] hover:bg-white/90"
            >
              Notify me
            </Button>
          </form>

          <Link
            href="/contact"
            className="group mt-8 inline-flex items-center gap-1.5 text-sm text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Or commission a custom piece
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
