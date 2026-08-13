import type { SparkPoint } from "./RevenueSparkline"

export type Period = "today" | "week" | "month" | "year" | "all"

export const periodLabels: Record<Period, string> = {
  today: "Today",
  week: "Last 7 days",
  month: "This month",
  year: "This year",
  all: "All time",
}

/** The short form the chips use — "Last 7 days" does not fit five across. */
export const periodChipLabels: Record<Period, string> = {
  today: "Today",
  week: "7 days",
  month: "Month",
  year: "Year",
  all: "All time",
}

export const periodCaptions: Record<Period, string> = {
  today: "Since midnight · vs yesterday",
  week: "Last 7 days · vs previous 7",
  month: "Month to date · vs last month",
  year: "Year to date · vs last year",
  all: "Since launch · lifetime",
}

interface BucketableOrder {
  createdAt: string
  totalAmount: number
}

/**
 * Revenue per bucket for the hero sparkline.
 *
 * Sums `totalAmount`, matching what `/api/admin/metrics` reports as revenue, so
 * the trace adds up to the headline figure above it. Bucket counts are chosen
 * to stay legible across roughly 358 pt of width.
 */
export function bucketRevenue(orders: BucketableOrder[], period: Period): SparkPoint[] {
  const now = new Date()

  if (period === "today") {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const buckets: SparkPoint[] = Array.from({ length: 24 }, (_, hour) => ({
      label: formatHour(hour),
      value: 0,
    }))
    for (const order of orders) {
      const at = new Date(order.createdAt)
      if (at >= start) buckets[at.getHours()].value += order.totalAmount
    }
    return buckets
  }

  if (period === "week") {
    const days: { key: string; point: SparkPoint }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      days.push({
        key: dayKey(d),
        point: {
          label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
          value: 0,
        },
      })
    }
    fillByDay(orders, days, startOfDayBefore(now, 6))
    return days.map((d) => d.point)
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const dayCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const days = Array.from({ length: dayCount }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), i + 1)
      return {
        key: dayKey(d),
        point: {
          label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          value: 0,
        },
      }
    })
    fillByDay(orders, days, start)
    return days.map((d) => d.point)
  }

  if (period === "year") {
    const months = Array.from({ length: 12 }, (_, m) => ({
      label: new Date(now.getFullYear(), m, 1).toLocaleDateString("en-GB", { month: "short" }),
      value: 0,
    }))
    for (const order of orders) {
      const at = new Date(order.createdAt)
      if (at.getFullYear() === now.getFullYear()) months[at.getMonth()].value += order.totalAmount
    }
    return months
  }

  // All time — monthly buckets from the first order to now.
  if (orders.length === 0) return []
  const earliest = orders.reduce((min, order) => {
    const at = new Date(order.createdAt)
    return at < min ? at : min
  }, new Date())

  const months: { key: string; point: SparkPoint }[] = []
  const cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1)
  while (cursor <= now) {
    months.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      point: {
        label: cursor.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
        value: 0,
      },
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  const index = new Map(months.map((m) => [m.key, m.point]))
  for (const order of orders) {
    const at = new Date(order.createdAt)
    const point = index.get(`${at.getFullYear()}-${at.getMonth()}`)
    if (point) point.value += order.totalAmount
  }
  return months.map((m) => m.point)
}

function fillByDay(
  orders: BucketableOrder[],
  days: { key: string; point: SparkPoint }[],
  start: Date
) {
  const index = new Map(days.map((d) => [d.key, d.point]))
  for (const order of orders) {
    const at = new Date(order.createdAt)
    if (at < start) continue
    const point = index.get(dayKey(at))
    if (point) point.value += order.totalAmount
  }
}

/** Local calendar day, not the UTC one `toISOString` would give. */
function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function startOfDayBefore(from: Date, daysBack: number): Date {
  const d = new Date(from)
  d.setDate(d.getDate() - daysBack)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 am"
  if (hour === 12) return "12 pm"
  return hour < 12 ? `${hour} am` : `${hour - 12} pm`
}
