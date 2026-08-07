import Link from "next/link"
import { ArrowRight } from "lucide-react"

/**
 * One shape for every section: an index eyebrow, a title whose last word
 * carries the serif, and an optional link out. The serif is rationed — this
 * and the wordmark are the only places it appears in the UI.
 */
export function SectionHeading({
  index,
  job,
  title,
  accent,
  href,
  linkLabel = "See all",
}: {
  index: string
  job: string
  title: string
  accent: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-end justify-between gap-3 px-4 pb-3">
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
          {index} · {job}
        </span>
        <h2 className="text-[19px] font-semibold tracking-[-0.02em]">
          {title}{" "}
          <span className="font-serif text-[21px] font-normal italic">
            {accent}
          </span>
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 py-1.5 text-[12.5px] font-medium text-muted-foreground"
        >
          {linkLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}
