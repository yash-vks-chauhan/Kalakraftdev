import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { getOptimizedImageUrl } from "../../../../lib/cloudinaryImages"
import { grain } from "./Pour"

/**
 * The one piece of the desktop's editorial voice that survives onto a phone.
 * It sits between the two buying sections so the page isn't an unbroken run
 * of product grids.
 */
export function EditorialBand() {
  return (
    <section className="px-4 pt-6">
      <Link
        href="/about"
        className={cn(
          "relative flex h-[235px] items-end overflow-hidden rounded-[calc(var(--radius)+4px)]",
          grain
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getOptimizedImageUrl(
            "featured2.png",
            "c_fill,w_780,h_470,q_auto:good,f_auto"
          )}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.8),rgba(0,0,0,0.06)_68%)]"
        />
        <span className="relative flex flex-col gap-2 p-[18px] text-white">
          <span className="text-[22px] font-light leading-[1.16]">
            Two hundred makers.
            <br />
            One pour at a <span className="font-serif italic">time.</span>
          </span>
          <span className="text-[12.5px] leading-relaxed text-white/80">
            Every piece is mixed, poured and cured by hand — which is why no two
            are the same.
          </span>
          <span className="mt-1 inline-flex w-fit items-center gap-1.5 border-b border-white/50 pb-0.5 text-[12.5px] font-semibold">
            Read the craft story
            <ArrowRight className="h-3 w-3" />
          </span>
        </span>
      </Link>
    </section>
  )
}
