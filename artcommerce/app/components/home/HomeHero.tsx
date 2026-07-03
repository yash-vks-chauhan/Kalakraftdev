'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DarkVeil from './DarkVeil'

const FLIP_WORDS = ['your home', 'clocks', 'trays', 'wall art', 'custom pieces']

// Serif flip word in the monochrome brand voice.
function FlipWord({ words, interval = 3000 }: { words: string[]; interval?: number }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % words.length), interval)
    return () => clearInterval(id)
  }, [words.length, interval])

  return (
    <span className="relative inline-block min-w-[13ch] text-left align-baseline">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: '0.5em', opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-0.5em', opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="inline-block italic text-[#e8e8e8]"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 26, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 1, delay, ease: [0.21, 0.47, 0.32, 0.98] as const },
})

// Dark gallery hero: the Vue Bits Dark Veil shader in monochrome is the
// artwork; everything else is quiet typography on black.
export default function HomeHero() {
  return (
    <section className="relative flex h-screen min-h-[680px] items-center justify-center overflow-hidden bg-[#020202]">
      {/* Monochrome Dark Veil */}
      <DarkVeil
        className="absolute inset-0 h-full w-full"
        speed={0.35}
        warpAmount={0.3}
        saturation={0}
        resolutionScale={0.75}
      />

      {/* Legibility vignette + grounding fade */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.5)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-black/70" />

      {/* Hairline gallery frame */}
      <div className="pointer-events-none absolute inset-6 border border-white/10" />

      {/* Centered composition */}
      <div className="relative z-10 flex max-w-4xl flex-col items-center px-10 text-center">
        <motion.p
          {...fadeUp(0.1)}
          className="text-[11px] font-medium uppercase tracking-[0.45em] text-white/50"
        >
          Kalakraft · Handcrafted Art Studio
        </motion.p>

        <motion.h1
          {...fadeUp(0.25)}
          className="mt-8 font-serif text-[4.25rem] font-medium leading-[1.05] text-white xl:text-[5rem]"
        >
          Handcrafted resin art
          <br />
          for <FlipWord words={FLIP_WORDS} />
        </motion.h1>

        <motion.p
          {...fadeUp(0.45)}
          className="mt-7 max-w-lg text-[15px] leading-relaxed text-white/60"
        >
          Every piece is poured, layered, and finished by hand in our studio —
          functional art that carries light and colour into everyday living.
        </motion.p>

        <motion.div {...fadeUp(0.6)} className="mt-10 flex items-center gap-3">
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
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 border-white/25 bg-transparent px-7 text-sm font-medium text-white hover:border-white/50 hover:bg-white/10 hover:text-white"
          >
            <Link href="#collections">Explore collections</Link>
          </Button>
        </motion.div>

        <motion.div
          {...fadeUp(0.75)}
          className="mt-12 flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-white/35"
        >
          <span>Museum-grade resin</span>
          <span className="h-1 w-1 rounded-full bg-white/25" />
          <span>Hand-poured layers</span>
          <span className="h-1 w-1 rounded-full bg-white/25" />
          <span>UV-resistant finish</span>
        </motion.div>
      </div>

      {/* Corner captions inside the frame */}
      <motion.p
        {...fadeUp(0.9)}
        className="absolute bottom-12 left-12 z-10 text-[11px] uppercase tracking-[0.25em] text-white/30"
      >
        Poured in small batches
      </motion.p>
      <motion.p
        {...fadeUp(0.9)}
        className="absolute bottom-12 right-12 z-10 text-[11px] uppercase tracking-[0.25em] text-white/30"
      >
        Every piece one of a kind
      </motion.p>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        aria-hidden="true"
      >
        <div className="relative h-10 w-px overflow-hidden bg-white/15">
          <motion.div
            className="absolute left-0 top-0 h-4 w-px bg-white/70"
            animate={{ y: [-16, 40] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  )
}
