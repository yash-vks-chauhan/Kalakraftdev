/**
 * Reads a shopper's sentence and pulls out what the catalogue can act on.
 *
 * Deliberately not a model: a lexicon sweep plus four price patterns over
 * columns the database already has. Auditable, instant, and free — and every
 * chip it produces maps onto a query parameter `/products` already accepts,
 * so the search hands off cleanly instead of starting again.
 *
 * Pure. No React, no fetch — the fixtures in the design doc are its test set.
 */

import {
  LITERAL,
  STOPWORDS,
  TRANSLATED,
  escapeForPattern,
  slugForCategory,
  termPattern,
  type ChipKind,
  type LexEntry,
} from "./searchLexicon"

export interface SearchChip {
  kind: ChipKind
  /** What to show, and for category/mood what to filter on. */
  value: string
  /** The words the shopper actually typed, when they differ from `value`. */
  source?: string
  /** Price only, both inclusive. `max` may be Infinity. */
  min?: number
  max?: number
}

export interface ParsedQuery {
  chips: SearchChip[]
  /** Whatever the lexicon could not claim — searched as free text. */
  rest: string
}

/** Category, then mood, then price — the order it reads as a sentence. */
const KIND_ORDER: Record<ChipKind, number> = { category: 0, mood: 1, price: 2 }

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})
const money = (value: number) => INR.format(value)

function toAmount(digits: string, thousands?: string): number {
  const base = Number(digits.replace(/,/g, ""))
  if (!Number.isFinite(base)) return NaN
  return thousands ? base * 1000 : base
}

const RANGE = /₹?\s*(\d[\d,]*)\s*(k)?\s*(?:-|–|—|to)\s*₹?\s*(\d[\d,]*)\s*(k)?/i
const UNDER = /(?:^|\s)(?:under|below|less than|cheaper than|upto|up to|within|max)\s*₹?\s*(\d[\d,]*)\s*(k)?/i
const OVER = /(?:^|\s)(?:over|above|more than|starting|from|min)\s*₹?\s*(\d[\d,]*)\s*(k)?/i
const BUDGET = /(?:^|\s)(?:cheap|budget|affordable|inexpensive)(?=\s|$)/i

/** Pulls at most one price constraint, most specific pattern first. */
function takePrice(haystack: string): { chip: SearchChip; rest: string } | null {
  const range = haystack.match(RANGE)
  if (range) {
    const lo = toAmount(range[1], range[2])
    const hi = toAmount(range[3], range[4])
    if (Number.isFinite(lo) && Number.isFinite(hi)) {
      return {
        chip: { kind: "price", value: `${money(lo)} – ${money(hi)}`, min: lo, max: hi },
        rest: haystack.replace(range[0], " "),
      }
    }
  }

  const under = haystack.match(UNDER)
  if (under) {
    const cap = toAmount(under[1], under[2])
    if (Number.isFinite(cap)) {
      return {
        chip: { kind: "price", value: `Under ${money(cap)}`, min: 0, max: cap },
        rest: haystack.replace(under[0], " "),
      }
    }
  }

  const over = haystack.match(OVER)
  if (over) {
    const floor = toAmount(over[1], over[2])
    if (Number.isFinite(floor)) {
      return {
        chip: { kind: "price", value: `Over ${money(floor)}`, min: floor, max: Infinity },
        rest: haystack.replace(over[0], " "),
      }
    }
  }

  if (BUDGET.test(haystack)) {
    return {
      // Matches the "Under ₹2,000" band the catalogue filter already offers.
      chip: { kind: "price", value: `Under ${money(2000)}`, min: 0, max: 1999 },
      rest: haystack.replace(BUDGET, " "),
    }
  }

  return null
}

export function parseSearchQuery(input: string): ParsedQuery {
  // Padded so the whitespace anchors have something to bite on at both ends.
  let rest = ` ${input ?? ""} `
  const chips: SearchChip[] = []
  const claimed = new Set<string>()

  const price = takePrice(rest)
  if (price) {
    chips.push(price.chip)
    rest = price.rest
  }

  const sweep = (entries: LexEntry[]) => {
    for (const entry of entries) {
      const pattern = termPattern(entry.terms)
      const hit = rest.match(pattern)
      if (!hit) continue

      const key = `${entry.kind}:${entry.value}`
      if (!claimed.has(key)) {
        claimed.add(key)
        const typed = hit[0].trim()
        chips.push({
          kind: entry.kind,
          value: entry.value,
          // Only carry the source when it adds something — no "Clocks → Clocks".
          source:
            entry.translated && typed.toLowerCase() !== entry.value.toLowerCase()
              ? typed
              : undefined,
        })
      }
      rest = rest.replace(pattern, " ")
    }
  }

  // Translations first: "matt rangoli" must not be eaten by "rangoli", and
  // "thali" must resolve before the literal pass sees a bare word.
  sweep(TRANSLATED)
  sweep(LITERAL)

  rest = rest.replace(STOPWORDS, " ").replace(/\s+/g, " ").trim()
  chips.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind])

  return { chips, rest }
}

/**
 * Removes the words that produced a chip, so the field and the chips above it
 * can never disagree. Whitespace-anchored for the same reason as the lexicon.
 */
export function removeChipFromQuery(query: string, chip: SearchChip): string {
  let out = ` ${query} `

  if (chip.kind === "price") {
    out = out
      .replace(RANGE, " ")
      .replace(UNDER, " ")
      .replace(OVER, " ")
      .replace(BUDGET, " ")
  } else {
    for (const word of [chip.source, chip.value].filter(Boolean) as string[]) {
      out = out.replace(
        new RegExp(`(?:^|\\s)${escapeForPattern(word)}(?=\\s|$)`, "gi"),
        " "
      )
    }
    /*
     * The typed word is often an alternative rather than the label — "watches"
     * for Clocks, "gift" for Gifting — so clear every alternation that yields
     * this value. All of them, not the first match: Gifting is produced by a
     * translated entry ("present") and a literal one ("gifts?|gifting"), and
     * stripping only the first left the word that made the chip still sitting
     * in the field, so it reappeared the moment we reparsed.
     */
    for (const entry of [...TRANSLATED, ...LITERAL]) {
      if (entry.kind !== chip.kind || entry.value !== chip.value) continue
      out = out.replace(new RegExp(`(?:^|\\s)(?:${entry.terms})(?=\\s|$)`, "gi"), " ")
    }
  }

  // A dangling connective left where a word used to be reads like a bug
  // ("watches for"), so drop stopwords that end up trailing.
  return out
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(?:\s|^)(?:for|of|to|with|in|on|at|and|the|a|an)$/i, "")
    .trim()
}

/** Turns the parsed state into the URL `/products` already understands. */
export function searchHref(chips: SearchChip[], rest: string): string {
  const params = new URLSearchParams()

  for (const chip of chips) {
    if (chip.kind === "category") params.set("category", slugForCategory(chip.value))
    if (chip.kind === "mood") params.append("usageTag", chip.value)
    if (chip.kind === "price") {
      if (chip.min) params.set("priceMin", String(chip.min))
      if (chip.max !== undefined && chip.max !== Infinity) {
        params.set("priceMax", String(chip.max))
      }
    }
  }
  if (rest) params.set("search", rest)

  const qs = params.toString()
  return qs ? `/products?${qs}` : "/products"
}
