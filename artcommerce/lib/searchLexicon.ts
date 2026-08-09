/**
 * The vocabulary customers actually use.
 *
 * This lived in three places that disagreed: ~50 bilingual entries inside
 * SearchModal, five inside the products API, and none at all in the mobile
 * palette — so "घड़ी" found clocks on a laptop and nothing on a phone, which
 * is backwards for this audience. One dictionary now, read by the parser and
 * by the API.
 *
 * Terms are matched on whitespace boundaries rather than `\b`, because `\b`
 * is defined against [A-Za-z0-9_]: `/\bघड़ी\b/` never matches, so the very
 * script this file exists for is the one word boundaries silently fail on.
 * Unicode property escapes with lookbehind would also work, but Safari only
 * shipped lookbehind in 16.4 and this is a storefront.
 */

export type ChipKind = "category" | "mood" | "price"

export interface LexEntry {
  /** Alternatives, as a regex alternation body. */
  terms: string
  kind: Exclude<ChipKind, "price">
  /** The canonical value — a category name or a usageTag. */
  value: string
  /**
   * True when the match is a translation or an inference rather than the
   * word itself, so the chip can show its working: "ghadi → Clocks".
   */
  translated?: boolean
}

/** Words people use that are not the label. These earn the arrow in the chip. */
export const TRANSLATED: LexEntry[] = [
  { terms: "ghadi|ghadiyan|ghadiyaan|घड़ी|घडी|watch|watches|timepiece", kind: "category", value: "Clocks", translated: true },
  { terms: "thali|thalee|थाली|platter|plate", kind: "category", value: "Trays", translated: true },
  { terms: "gamla|गमला|phooldaan|फूलदान|guldaan|planter|flower ?vase", kind: "category", value: "Pots & Vases", translated: true },
  { terms: "kolam|alpana|alpona|अल्पना|रंगोली", kind: "category", value: "Rangoli", translated: true },
  { terms: "shisha ?kala|शीशा कला|mirror ?work", kind: "category", value: "Wall Art", translated: true },
  { terms: "shaadi|shadi|marriage|reception", kind: "mood", value: "Wedding", translated: true },
  { terms: "diwali|deepavali|दिवाली|festival|rakhi|holi", kind: "mood", value: "Festive", translated: true },
  { terms: "pooja|पूजा|mandir|prayer|aarti", kind: "mood", value: "Puja", translated: true },
  { terms: "griha ?pravesh|new home|moving in", kind: "mood", value: "Housewarming", translated: true },
  { terms: "hallway|entrance|foyer|porch|doorway", kind: "mood", value: "Entryway", translated: true },
  { terms: "hall|drawing ?room|lounge|sitting ?room", kind: "mood", value: "Living room", translated: true },
  { terms: "office|study|workspace|table", kind: "mood", value: "Desk", translated: true },
  { terms: "present|prezzie", kind: "mood", value: "Gifting", translated: true },
]

/** The words themselves. Matched after the translations, so "matt rangoli" wins over "rangoli". */
export const LITERAL: LexEntry[] = [
  { terms: "matt ?rangolis?", kind: "category", value: "Matt Rangoli" },
  { terms: "rangolis?", kind: "category", value: "Rangoli" },
  { terms: "clocks?", kind: "category", value: "Clocks" },
  { terms: "trays?", kind: "category", value: "Trays" },
  { terms: "vases?|pots?", kind: "category", value: "Pots & Vases" },
  { terms: "coasters?", kind: "category", value: "Coasters" },
  { terms: "wall ?(?:art|piece|panel|decor|hanging)", kind: "category", value: "Wall Art" },
  { terms: "gifts?|gifting", kind: "mood", value: "Gifting" },
  { terms: "housewarming", kind: "mood", value: "Housewarming" },
  { terms: "festive", kind: "mood", value: "Festive" },
  { terms: "puja", kind: "mood", value: "Puja" },
  { terms: "wedding", kind: "mood", value: "Wedding" },
  { terms: "desk", kind: "mood", value: "Desk" },
  { terms: "entryway", kind: "mood", value: "Entryway" },
  { terms: "living ?room", kind: "mood", value: "Living room" },
]

/**
 * Filler that carries no intent. Stripped after the lexicon has had its turn,
 * so "something for the hallway" leaves nothing behind to search on.
 */
export const STOPWORDS =
  /(?:^|\s)(?:a|an|the|for|of|to|some|something|any|my|our|your|with|and|in|on|at|is|are|nice|good|best|please|need|want|looking|show|me|piece|pieces|item|items|idea|ideas)(?=\s|$)/gi

/** Whitespace-anchored matcher. See the note at the top of this file. */
export function termPattern(terms: string): RegExp {
  return new RegExp(`(?:^|\\s)(?:${terms})(?=\\s|$)`, "i")
}

/** Escapes a literal so it can be spliced back into a pattern safely. */
export function escapeForPattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Category display name → the slug `/products?category=` expects. */
export const CATEGORY_SLUGS: Record<string, string> = {
  Clocks: "clocks",
  "Wall Art": "wall art",
  Rangoli: "rangolis",
  "Matt Rangoli": "matt rangoli",
  Trays: "tray",
  "Pots & Vases": "pots & vases",
  Coasters: "coasters",
}

export function slugForCategory(name: string): string {
  return CATEGORY_SLUGS[name] ?? name.toLowerCase()
}
