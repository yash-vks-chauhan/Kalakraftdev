import Link from "next/link"
import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Pour, grain } from "./Pour"

/**
 * One statement, two actions, the pour behind it.
 *
 * Deliberately not a carousel: rotating heroes split the message and measure
 * badly. The navbar sits transparent over this block and turns solid past it,
 * which is why the bottom of the gradient resolves to the page background.
 */
export function HeroPour() {
  return (
    <section
      className={cn("relative h-[470px] shrink-0 overflow-hidden bg-stone-950", grain)}
    >
      <Pour />

      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--background))_1%,rgba(16,13,12,0.55)_42%,rgba(16,13,12,0.62))]"
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 px-5 pb-7 text-white">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.14] px-2.5 py-1 text-[9.5px] font-medium uppercase tracking-[0.2em] text-white/90 backdrop-blur">
          <Sparkles className="h-2.5 w-2.5" />
          Poured this week
        </span>

        <h1 className="text-[38px] font-light leading-[1.06] tracking-[-0.02em]">
          Where every piece
          <br />
          tells a <span className="font-serif italic">story.</span>
        </h1>

        <p className="max-w-[30ch] text-[13.5px] leading-relaxed text-white/75">
          One-of-a-kind resin art, ceramics and décor from India&apos;s most
          thoughtful makers.
        </p>

        <div className="flex gap-2.5 pt-1">
          <Button asChild size="lg" className="h-11 bg-white text-stone-900 hover:bg-white/90">
            <Link href="/products?sort=newest">Shop new arrivals</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/about">The craft</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
