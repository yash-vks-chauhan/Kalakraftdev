'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { Droplet, Layers, Sun } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { getImageUrl } from '../../../lib/cloudinaryImages'
import SectionHeader from './SectionHeader'
import Reveal from './Reveal'

const FEATURES = [
  {
    icon: Droplet,
    title: 'Museum-grade resin',
    text: 'Hand-mixed for crystal clarity and vibrant hues that endure for generations.',
  },
  {
    icon: Layers,
    title: 'Precision pouring',
    text: 'Controlled, bubble-free layers for a seamless, mirror-smooth surface.',
  },
  {
    icon: Sun,
    title: 'UV-resistant gloss',
    text: 'An anti-yellowing top coat protects colour and shine from sun exposure.',
  },
]

const STATS = [
  { value: 500, suffix: '+', label: 'Pieces crafted' },
  { value: 40, suffix: '+', label: 'Cities delivered' },
  { value: 4.9, suffix: '', label: 'Average rating', decimals: 1 },
]

// Viewport-triggered count-up (the Vue Bits CountUp idea, ~30 lines of rAF).
function CountUp({
  value,
  suffix = '',
  decimals = 0,
  duration = 1600,
}: {
  value: number
  suffix?: string
  decimals?: number
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])

  return (
    <span ref={ref}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}

export default function CraftSection() {
  return (
    <section className="bg-[#fafafa]">
      <div className="mx-auto max-w-7xl px-10 py-28 2xl:px-4">
        <div className="grid grid-cols-12 gap-16">
          {/* Sticky narrative column */}
          <div className="col-span-5">
            <div className="sticky top-28">
              <Reveal>
                <SectionHeader
                  eyebrow="Our process"
                  title="Artistry in every layer"
                  sub="Our resin art combines premium materials with meticulous craftsmanship — pieces that capture light, colour, and imagination in ways that endure."
                />
              </Reveal>

              <Reveal delay={0.15}>
                <div className="mt-12 flex items-center gap-10">
                  {STATS.map(stat => (
                    <div key={stat.label}>
                      <p className="font-serif text-4xl font-medium text-[#1a1a1a]">
                        <CountUp
                          value={stat.value}
                          suffix={stat.suffix}
                          decimals={stat.decimals ?? 0}
                        />
                      </p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#999]">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>

          {/* Process image + feature rows */}
          <div className="col-span-7">
            <Reveal>
              <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white">
                <img
                  src={getImageUrl('DSC01366.JPG')}
                  alt="Resin being poured in the Kalakraft studio"
                  loading="lazy"
                  className="aspect-[16/10] w-full object-cover"
                  onError={e => {
                    e.currentTarget.src = 'https://placehold.co/1200x750/f0f0f0/999?text=In+the+studio'
                  }}
                />
              </div>
            </Reveal>

            <div className="mt-12">
              {FEATURES.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 0.08}>
                  {i > 0 && <Separator className="bg-[#e5e5e5]" />}
                  <div className="flex items-start gap-5 py-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#e5e5e5] bg-white">
                      <feature.icon className="h-5 w-5 text-[#1a1a1a]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-medium text-[#1a1a1a]">{feature.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-[#666]">{feature.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
