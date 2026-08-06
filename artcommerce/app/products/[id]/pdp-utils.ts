// Shared helpers for the desktop product-details experience.
// Prices come from lib/formatPrice — every surface reads from the one source.

export interface SpecRow {
  key: string
  value: string
}

// Admins type specifications as free text, one per line, usually as
// "Diameter: 12 inches". Split the key/value pairs out so they can be set as a
// definition list; lines without a colon come back as prose.
export function parseSpecs(text?: string | null): { rows: SpecRow[]; notes: string[] } {
  const rows: SpecRow[] = []
  const notes: string[] = []
  if (!text) return { rows, notes }

  for (const line of text.split('\n')) {
    const t = line.trim().replace(/^[-•]\s*/, '')
    if (!t) continue
    const i = t.indexOf(':')
    if (i > 0 && i < t.length - 1) {
      rows.push({ key: t.slice(0, i).trim(), value: t.slice(i + 1).trim() })
    } else {
      notes.push(t)
    }
  }
  return { rows, notes }
}

// Care instructions are a plain list of one-line directions.
export function parseLines(text?: string | null): string[] {
  if (!text) return []
  return text
    .split('\n')
    .map(l => l.trim().replace(/^[-•]\s*/, ''))
    .filter(Boolean)
}

// "18 May 2026" — unambiguous and calm, no relative-time churn.
export function formatReviewDate(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function initialsFrom(name?: string | null) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'K'
  if (parts.length === 1) return parts[0][0]!.toUpperCase()
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase()
}

// One easing curve across the page — the same one the homepage moves on.
export const EASE = [0.21, 0.47, 0.32, 0.98] as const
