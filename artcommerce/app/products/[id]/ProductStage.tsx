'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE } from './pdp-utils'

interface ProductStageProps {
  images: string[]
  name: string
}

// The viewing wall: a contact-sheet rail of every angle beside one large,
// matted stage. The piece is lit from above by the matte's own gradient and
// opens full-bleed against near-black when you want to look closer.
export default function ProductStage({ images, name }: ProductStageProps) {
  const [index, setIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const reduced = useReducedMotion()

  const total = images.length
  const step = useCallback(
    (dir: 1 | -1) => setIndex(i => (i + dir + total) % total),
    [total],
  )

  // Warm the neighbours so stepping through angles never shows a blank matte.
  useEffect(() => {
    if (total < 2) return
    for (const offset of [1, -1]) {
      const img = new Image()
      img.src = images[(index + offset + total) % total]
    }
  }, [index, images, total])

  // Arrow keys drive the stage; they take over the whole window only while
  // the lightbox owns the screen.
  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false)
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [zoomed, step])

  const current = images[index]

  const arrow =
    'flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e5e5] bg-white ' +
    'text-[#1a1a1a] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.18)] transition-all duration-300 ' +
    'hover:border-[#d4d4d4] hover:shadow-[0_6px_18px_-6px_rgba(0,0,0,0.24)] active:scale-95'

  return (
    <>
      <div className="flex flex-col gap-3.5">
        {/* Stage */}
        <div className="group relative rounded-2xl border border-[#e5e5e5] bg-white p-3">
          <div
            className="relative h-[560px] overflow-hidden rounded-xl"
            style={{
              background:
                'radial-gradient(120% 90% at 50% 0%, #ffffff 0%, #f7f6f4 55%, #efeeeb 100%)',
            }}
          >
            {current ? (
              <button
                type="button"
                onClick={() => setZoomed(true)}
                aria-label="Enlarge image"
                className="absolute inset-0 block cursor-zoom-in outline-none"
              >
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.img
                    key={current}
                    src={current}
                    alt={name}
                    initial={{ opacity: 0, scale: reduced ? 1 : 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: EASE }}
                    className="absolute inset-0 h-full w-full object-contain p-8 drop-shadow-[0_26px_38px_rgba(0,0,0,0.13)] transition-transform duration-[900ms] ease-[cubic-bezier(0.21,0.47,0.32,0.98)] group-hover:scale-[1.035]"
                  />
                </AnimatePresence>
              </button>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[13px] text-[#999]">
                No image available
              </div>
            )}

            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous image"
                  className={cn(
                    arrow,
                    'absolute left-5 top-1/2 -translate-x-1 -translate-y-1/2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100',
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next image"
                  className={cn(
                    arrow,
                    'absolute right-5 top-1/2 translate-x-1 -translate-y-1/2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100',
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Plate: which angle you're on */}
            {total > 1 && (
              <span className="pointer-events-none absolute bottom-5 left-6 text-[11px] font-medium tabular-nums tracking-[0.2em] text-[#b0aca6]">
                {String(index + 1).padStart(2, '0')}
                <span className="mx-1.5 text-[#d8d4ce]">/</span>
                {String(total).padStart(2, '0')}
              </span>
            )}

            {current && (
              <span className="pointer-events-none absolute bottom-4 right-5 inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white/90 px-3 py-1.5 text-[11px] font-medium tracking-[0.06em] text-[#666] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Expand className="h-3 w-3" /> Click to enlarge
              </span>
            )}
          </div>
        </div>

        {/* Contact sheet — every angle, laid out like proof prints */}
        {total > 1 && (
          <div className="flex items-center gap-2.5">
            {images.map((url, i) => (
              <button
                key={url + i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`View angle ${i + 1} of ${total}`}
                aria-current={i === index}
                className="group relative block outline-none"
              >
                <span
                  className={cn(
                    'block h-[72px] w-[72px] overflow-hidden rounded-md border bg-[#fafafa] transition-all duration-300',
                    i === index
                      ? 'border-[#1a1a1a]'
                      : 'border-[#e5e5e5] group-hover:border-[#b9b9b9]',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className={cn(
                      'h-full w-full object-contain p-1.5 transition-all duration-500',
                      i === index
                        ? 'opacity-100 grayscale-0'
                        : 'opacity-70 grayscale-[0.45] group-hover:opacity-100 group-hover:grayscale-0',
                    )}
                  />
                </span>
                {i === index && (
                  <motion.span
                    layoutId="stage-marker"
                    aria-hidden="true"
                    className="absolute -bottom-1.5 left-1/2 h-[2px] w-6 -translate-x-1/2 bg-[#d4a373]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox — the piece against the dark of the gallery */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="fixed inset-0 z-[120] flex flex-col bg-[#0a0908]/[0.97] backdrop-blur-sm"
            onClick={() => setZoomed(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${name} — enlarged view`}
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-8">
              <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/45">
                {name}
              </span>
              <button
                type="button"
                onClick={() => setZoomed(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-16">
              <AnimatePresence initial={false} mode="wait">
                <motion.img
                  key={current}
                  src={current}
                  alt={name}
                  initial={{ opacity: 0, scale: reduced ? 1 : 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  onClick={e => e.stopPropagation()}
                  className="max-h-full max-w-full object-contain"
                />
              </AnimatePresence>

              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      step(-1)
                    }}
                    aria-label="Previous image"
                    className="absolute left-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/35 hover:text-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      step(1)
                    }}
                    aria-label="Next image"
                    className="absolute right-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/35 hover:text-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {total > 1 && (
              <div
                className="flex h-24 shrink-0 items-center justify-center gap-2.5"
                onClick={e => e.stopPropagation()}
              >
                {images.map((url, i) => (
                  <button
                    key={url + i}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`View angle ${i + 1}`}
                    className={cn(
                      'h-14 w-14 overflow-hidden rounded-md border transition-all duration-300',
                      i === index
                        ? 'border-[#d4a373] opacity-100'
                        : 'border-white/15 opacity-45 hover:opacity-80',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full bg-white object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
