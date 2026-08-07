/**
 * Category has no image column, so thumbnails are matched by name against the
 * same Cloudinary assets the desktop mega-menu uses. Anything unmatched falls
 * back to a tinted disc rather than a broken image.
 */
const BY_NAME: Record<string, string> = {
  clocks: "category1.png",
  "jewelry trays": "category2.png",
  "jewellery trays": "category2.png",
  "pots & vases": "category3.png",
  pots: "category3.png",
  vases: "category3.png",
  trays: "category4.png",
  tray: "category4.png",
  "matt rangoli": "category5.png",
  "wall art": "category6.png",
  "wall decor": "category6.png",
  "wall décor": "category6.png",
  decor: "category6.png",
  paintings: "category7.png",
  rangolis: "category8.png",
  rangoli: "category8.png",
}

export function categoryImage(name: string): string | null {
  return BY_NAME[name.trim().toLowerCase()] ?? null
}

/**
 * Deterministic swatch for categories with no matching asset — muted resin
 * tones rather than saturated hues, so a fallback still looks poured.
 */
const SWATCHES = [
  ["#e8c9a4", "#9d4a3b"],
  ["#cfe0e6", "#2f5d73"],
  ["#ecd2dc", "#7d3050"],
  ["#dbe4cc", "#3f5b34"],
  ["#f0e2b8", "#8a6a1f"],
  ["#ded8ee", "#453a72"],
  ["#f2d8cc", "#a5462c"],
  ["#cfe6dc", "#22614c"],
]

export function categoryTint(name: string): string {
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  const [light, deep] = SWATCHES[sum % SWATCHES.length]
  return `radial-gradient(circle at 32% 28%, ${light}, transparent 62%), radial-gradient(circle at 72% 74%, ${deep}, transparent 66%), ${light}`
}
