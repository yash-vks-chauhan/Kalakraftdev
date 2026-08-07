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

/** Deterministic warm tint so an unmatched category still looks intentional. */
export function categoryTint(name: string): string {
  const hues = [28, 12, 340, 262, 45, 190, 96, 320]
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  const hue = hues[sum % hues.length]
  return `linear-gradient(140deg, hsl(${hue} 55% 72%), hsl(${(hue + 28) % 360} 45% 46%))`
}
