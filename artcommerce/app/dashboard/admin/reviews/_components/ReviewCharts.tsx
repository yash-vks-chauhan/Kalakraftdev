"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import { Star } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

/**
 * The desktop charts, in their own module so they can be loaded on demand.
 *
 * Recharts is a substantial dependency, and the phone never renders either of
 * these — a 30-day line chart with daily ticks compressed into 358px is a
 * texture, not a reading, so the mobile screen shows a distribution strip
 * instead. Importing this from page.tsx directly would still ship recharts to
 * every phone that opens the page; behind `next/dynamic` it is fetched only
 * when the desktop branch actually mounts.
 */
export function ReviewCharts({
  distribution,
  trend,
  total,
}: {
  distribution: { rating: string; stars: number; count: number; pct: number }[]
  trend: { date: string; label: string; reviews: number }[]
  total: number
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Rating distribution</CardTitle>
          <CardDescription>
            Where shoppers are landing on the 5-star scale.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {total === 0 ? (
            <EmptyChart message="No reviews yet" />
          ) : (
            <DistributionChart data={distribution} />
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Last 30 days</CardTitle>
          <CardDescription>Daily review volume.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {total === 0 ? (
            <EmptyChart message="No activity yet" />
          ) : (
            <TrendChart data={trend} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const distributionConfig = {
  count: { label: 'Reviews', color: 'hsl(var(--primary))' },
} satisfies ChartConfig

const ratingColor: Record<number, string> = {
  5: 'hsl(142 71% 45%)',
  4: 'hsl(160 60% 45%)',
  3: 'hsl(38 92% 50%)',
  2: 'hsl(25 95% 53%)',
  1: 'hsl(0 84% 60%)',
}

function DistributionChart({
  data,
}: {
  data: { rating: string; stars: number; count: number; pct: number }[]
}) {
  return (
    <ChartContainer config={distributionConfig} className="aspect-auto h-[220px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} className="stroke-border/50" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="rating"
          axisLine={false}
          tickLine={false}
          width={36}
          className="fill-muted-foreground text-xs"
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => {
                const pct = (item.payload as any).pct as number
                return (
                  <div className="flex w-full justify-between gap-4">
                    <span className="text-muted-foreground">{(item.payload as any).rating}</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {Number(value).toLocaleString()} · {pct}%
                    </span>
                  </div>
                )
              }}
            />
          }
        />
        <Bar dataKey="count" radius={[4, 4, 4, 4]} barSize={18}>
          {data.map((d) => (
            <Cell key={d.rating} fill={ratingColor[d.stars]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

const trendConfig = {
  reviews: { label: 'Reviews', color: 'hsl(var(--primary))' },
} satisfies ChartConfig

function TrendChart({
  data,
}: {
  data: { date: string; label: string; reviews: number }[]
}) {
  return (
    <ChartContainer config={trendConfig} className="aspect-auto h-[220px] w-full">
      <LineChart data={data} margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid vertical={false} className="stroke-border/50" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          minTickGap={32}
          className="fill-muted-foreground text-xs"
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          width={28}
          className="fill-muted-foreground text-xs"
        />
        <ChartTooltip
          content={<ChartTooltipContent indicator="dot" labelKey="label" />}
        />
        <Line
          type="monotone"
          dataKey="reviews"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground">
      <Star className="h-5 w-5" />
      {message}
    </div>
  )
}
