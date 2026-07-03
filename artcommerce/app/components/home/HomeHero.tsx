'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ResinVeil from './ResinVeil'

// The one accent in an otherwise monochrome page: molten copper, echoing the
// pigment ribbons in the resin background.
const ACCENT = '#d4a373'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 26, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 1, delay, ease: [0.21, 0.47, 0.32, 0.98] as const },
})

// Dark gallery hero: a living resin pour is the artwork. The composition is
// editorial — headline anchored low-left, supporting copy and actions on the
// right, a quiet spec line along the base. The upper two thirds of the
// viewport stay empty so the material can breathe.
//
// The section is sticky: the rest of the page scrolls over the resin like a
// curtain, and the material dims as it is covered. Once fully hidden the
// canvas switches to display:none so the shader loop stops.
export default function HomeHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [viewportH, setViewportH] = useState(0)
  const [covered, setCovered] = useState(false)

  const { scrollY } = useScroll()
  const dim = useTransform(scrollY, [0, viewportH || 900], [0, 0.72])

  useEffect(() => {
    const measure = () => setViewportH(window.innerHeight)
    const onScroll = () => {
      const heroH = sectionRef.current?.offsetHeight ?? window.innerHeight
      setCovered(window.scrollY > heroH + 120)
    }
    measure()
    onScroll()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="sticky top-0 z-0 h-screen min-h-[720px] overflow-hidden bg-[#020202]"
    >
      <ResinVeil className={`absolute inset-0 h-full w-full ${covered ? 'hidden' : ''}`} />

      {/* Grounding fades */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/75 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col justify-end px-10 pb-14 lg:px-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
          {/* Headline */}
          <div>
            <motion.p
              {...fadeUp(0.1)}
              className="text-[11px] font-medium uppercase tracking-[0.45em] text-white/45"
            >
              Kalakraft · Handcrafted Art Studio
            </motion.p>
            <motion.h1
              {...fadeUp(0.25)}
              className="mt-7 font-serif text-[4.25rem] font-medium leading-[1.04] text-white xl:text-[5.25rem]"
            >
              Functional art,
              <br />
              <span className="italic" style={{ color: ACCENT }}>
                poured by hand.
              </span>
            </motion.h1>
          </div>

          {/* Supporting column */}
          <div className="max-w-sm lg:pb-4">
            <motion.p {...fadeUp(0.45)} className="text-[15px] leading-relaxed text-white/55">
              Resin clocks, trays, and wall art — each piece layered and
              finished in our studio, carrying light and colour into everyday
              living.
            </motion.p>
            <motion.div {...fadeUp(0.6)} className="mt-8 flex items-center gap-8">
              <Button
                asChild
                size="lg"
                className="h-11 bg-white px-7 text-sm font-medium text-[#1a1a1a] hover:bg-[#e8e8e8]"
              >
                <Link href="/products">
                  Shop all pieces
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Link
                href="#collections"
                className="group text-sm font-medium text-white/65 transition-colors hover:text-white"
              >
                Explore collections
                <span className="mt-1.5 block h-px w-full bg-white/25 transition-colors duration-300 group-hover:bg-white/70" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Base spec line */}
        <motion.div
          {...fadeUp(0.8)}
          className="mt-16 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/30"
        >
          <span>Museum-grade resin</span>
          <span className="hidden md:inline">Hand-poured layers</span>
          <span className="hidden md:inline">UV-resistant finish</span>
          <span>Every piece one of a kind</span>
        </motion.div>
      </div>

      {/* Darkens as the page scrolls over the pour */}
      <motion.div
        style={{ opacity: dim }}
        className="pointer-events-none absolute inset-0 z-20 bg-black"
        aria-hidden="true"
      />
    </section>
  )
}
