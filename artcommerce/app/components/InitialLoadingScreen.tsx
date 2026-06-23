'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { getImageUrl } from '../../lib/cloudinaryImages'
import styles from './InitialLoadingScreen.module.css'

interface InitialLoadingScreenProps {
  currentStep?: number
}

/** Steps map 1:1 to the real preload stages in AppContentWrapper. */
const STEPS = [
  'Preparing your gallery',
  'Gathering collections',
  'Curating featured pieces',
  'Almost ready',
]

export default function InitialLoadingScreen({
  currentStep = 0,
}: InitialLoadingScreenProps) {
  const logoSrc = getImageUrl('logo.png')
  const tiltRef = useRef<HTMLImageElement>(null)
  const step = Math.min(Math.max(currentStep, 0), STEPS.length - 1)

  // Perceived progress trickles smoothly toward a per-step target, so the bar
  // never looks frozen — including when data is cached and the step stays 0.
  const [pct, setPct] = useState(6)
  useEffect(() => {
    const TARGETS = [34, 60, 82, 96]
    const target = TARGETS[step]
    const id = setInterval(() => {
      setPct((prev) => {
        if (prev >= target) return prev
        const next = prev + (target - prev) * 0.12 + 0.4
        return next > target ? target : next
      })
    }, 120)
    return () => clearInterval(id)
  }, [step])

  // Subtle cursor tilt on the seal (desktop only) — written straight to the
  // node via rAF, never triggering a React re-render.
  useEffect(() => {
    const el = tiltRef.current
    if (!el || typeof window === 'undefined') return
    if (window.matchMedia('(pointer: coarse)').matches) return

    let raf = 0
    const onMove = (e: MouseEvent) => {
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        const rx = (e.clientX / window.innerWidth - 0.5) * 10 // -5..5deg
        const ry = (0.5 - e.clientY / window.innerHeight) * 10
        el.style.setProperty('--rx', `${rx.toFixed(2)}deg`)
        el.style.setProperty('--ry', `${ry.toFixed(2)}deg`)
        raf = 0
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-background"
      role="status"
      aria-live="polite"
      aria-label="Loading Kalakraft"
    >
      {/* Faint backdrop for depth */}
      <div aria-hidden className={styles.backdrop} />

      <div className={cn('relative flex flex-col items-center gap-7 px-6', styles.enter)}>
        {/* Seal with concentric sonar pulses */}
        <div className="relative grid place-items-center">
          <span aria-hidden className={styles.sonar} />
          <span aria-hidden className={cn(styles.sonar, styles.sonarDelay)} />
          <div className={styles.float}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={tiltRef}
              src={logoSrc}
              alt="Kalakraft"
              width={120}
              height={120}
              className={cn('relative h-28 w-28 object-contain', styles.tilt)}
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        {/* Tagline */}
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Handcrafted art &amp; décor
        </p>

        {/* Progress meter (shadcn tokens) */}
        <div className="flex w-[min(280px,78vw)] flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span key={step} className={cn('text-xs text-muted-foreground', styles.stepFade)}>
              {STEPS[step]}
            </span>
            <span className="text-xs tabular-nums text-foreground/70">
              {Math.round(pct)}%
            </span>
          </div>
          <div className="relative h-1 overflow-hidden rounded-full bg-muted">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-foreground transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
            <span aria-hidden className={styles.shimmer} />
          </div>
        </div>
      </div>
    </div>
  )
}
