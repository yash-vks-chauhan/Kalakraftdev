import { TRUST_STATS } from "../../../auth/_components/AuthBits"

/**
 * The same three numbers the auth screens show, from the same constant, so
 * the storefront and the sign-in wall can never quote different figures.
 */
export function TrustStrip() {
  return (
    <section className="px-4 pt-6">
      <div className="flex overflow-hidden rounded-[calc(var(--radius)+4px)] border">
        {TRUST_STATS.map((stat) => (
          <div
            key={stat.short}
            className="flex flex-1 flex-col items-center gap-0.5 border-r px-1.5 py-3 last:border-r-0"
          >
            <b className="text-[15px] font-semibold tabular-nums">{stat.value}</b>
            <span className="text-[9.5px] uppercase tracking-wide text-muted-foreground">
              {stat.short}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
