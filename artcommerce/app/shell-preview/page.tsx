'use client'

// TEMPORARY preview of the redesigned /products shell (persistent sidebar +
// top bar) without a DB. Mirrors the real markup. Delete me.

import React, { useState } from 'react'
import Link from 'next/link'
import ProductCardPro from '../products/ProductCardPro'
import { cn } from '@/lib/utils'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Heart, ShoppingCart, User, ChevronDown, Check, X } from 'lucide-react'
import { FiChevronLeft } from 'react-icons/fi'

const sq = (hue: number, label: string) =>
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="hsl(${hue},55%,72%)"/><stop offset="100%" stop-color="hsl(${hue},45%,52%)"/></radialGradient></defs><circle cx="300" cy="300" r="190" fill="url(#g)"/><text x="300" y="315" font-family="Georgia" font-size="40" fill="rgba(255,255,255,0.85)" text-anchor="middle">${label}</text></svg>`)

const CATS = [
  { slug: 'clocks', name: 'Clocks' }, { slug: 'pots', name: 'Pots' },
  { slug: 'tray', name: 'Trays' }, { slug: 'rangoli', name: 'Rangoli' },
  { slug: 'decor', name: 'Wall Decor' }, { slug: 'mirror work', name: 'Mirror Work' },
]
const products = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1, name: ['Brass Pendulum Clock', 'Ceramic Pot', 'Mirror Tray', 'Rangoli Set', 'Wall Decor Panel', 'Terracotta Duo', 'Resin Clock', 'Bud Vase'][i],
  currency: '₹', price: [2400, 1150, 3200, 900, 2750, 1600, 1980, 740][i],
  imageUrls: [sq((i * 47) % 360, 'I'), sq((i * 47 + 120) % 360, 'II')],
  stockQuantity: [12, 3, 0, 20, 8, 15, 5, 9][i],
  category: { id: 1, name: CATS[i % CATS.length].name, slug: CATS[i % CATS.length].slug },
  avgRating: [4.5, 0, 5, 3, 4, 4.5, 2, 5][i], ratingCount: [12, 0, 38, 5, 9, 21, 3, 7][i],
}))

export default function ShellPreview() {
  const [open, setOpen] = useState<Record<string, boolean>>({ category: true, mood: false, rating: true, stock: false })
  const [cat, setCat] = useState('clocks')
  const [rating, setRating] = useState('4')
  const [inStock, setInStock] = useState(true)

  const radioRow = (selected: boolean, label: React.ReactNode, onClick: () => void) => (
    <button onClick={onClick} className={cn('group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13.5px] transition-colors', selected ? 'text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900')}>
      <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors', selected ? 'border-zinc-900' : 'border-zinc-300 group-hover:border-zinc-400')}>{selected && <span className="h-2 w-2 rounded-full bg-zinc-900" />}</span>
      <span className="flex-1">{label}</span>
    </button>
  )
  const checkRow = (checked: boolean, label: React.ReactNode, onClick: () => void) => (
    <button onClick={onClick} className={cn('group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13.5px] transition-colors', checked ? 'text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900')}>
      <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors', checked ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 group-hover:border-zinc-400')}>{checked && <Check className="h-3 w-3" />}</span>
      <span className="flex-1">{label}</span>
    </button>
  )
  const Section = ({ id, label, children }: any) => (
    <div className="border-b border-zinc-100 last:border-0">
      <button onClick={() => setOpen(o => ({ ...o, [id]: !o[id] }))} className="flex w-full items-center justify-between px-2 py-3.5 text-left">
        <span className="text-[12px] font-semibold uppercase tracking-[0.09em] text-zinc-900">{label}</span>
        <ChevronDown className={cn('h-4 w-4 text-zinc-400 transition-transform duration-300', open[id] && 'rotate-180')} />
      </button>
      <div className={cn('grid transition-all duration-300 ease-out', open[id] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
        <div className="overflow-hidden"><div className="pb-3">{children}</div></div>
      </div>
    </div>
  )

  return (
    <div className="flex w-full bg-white">
      <aside className="sticky top-0 z-40 hidden h-screen w-[280px] shrink-0 flex-col border-r border-zinc-200/80 bg-white/85 backdrop-blur-xl lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-zinc-200/70 px-5">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-zinc-900/[0.06]"><span className="text-[15px] font-bold text-zinc-700">K</span></span>
          <span className="flex flex-col leading-none"><span className="text-[14px] font-semibold tracking-tight text-zinc-900">Kalakraft</span><span className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.2em] text-zinc-400">Handcrafted</span></span>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col">
            <Section id="category" label="Category">{CATS.map(c => <div key={c.slug}>{radioRow(cat === c.slug, c.name, () => setCat(cat === c.slug ? '' : c.slug))}</div>)}</Section>
            <Section id="mood" label="Purpose / Mood">{['Gifting', 'Festive', 'Everyday'].map(t => <div key={t}>{radioRow(false, t, () => {})}</div>)}</Section>
            <Section id="rating" label="Rating">{[4, 3, 2, 1].map(thr => <div key={thr}>{radioRow(rating === String(thr), <span className="flex items-center gap-1"><span className="text-amber-400">{'★'.repeat(thr)}</span><span className="text-zinc-400">&amp; up</span></span>, () => setRating(rating === String(thr) ? '' : String(thr)))}</div>)}</Section>
            <Section id="stock" label="Availability">{checkRow(inStock, 'In stock only', () => setInStock(v => !v))}{checkRow(false, 'Low stock', () => {})}</Section>
          </div>
        </div>
        <div className="shrink-0 border-t border-zinc-200/70 px-5 py-3"><span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 hover:text-zinc-700"><FiChevronLeft size={14} /> Back to home</span></div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-200/80 bg-white/70 px-6 backdrop-blur-xl xl:px-10">
          <div className="flex items-baseline gap-3"><h1 className="text-[15px] font-semibold tracking-tight text-zinc-900">Clocks</h1><span className="hidden text-[13px] text-zinc-400 sm:inline">8 of 8</span></div>
          <div className="flex items-center gap-1.5">
            <Select defaultValue="newest"><SelectTrigger size="sm" className="h-9 gap-2 rounded-full border-zinc-200/80 bg-white/70 px-4 text-[13px] font-medium text-zinc-800 hover:bg-white"><span className="text-zinc-400">Sort</span><SelectValue /></SelectTrigger><SelectContent align="end"><SelectItem value="newest">Newest</SelectItem><SelectItem value="price_asc">Price: Low to High</SelectItem></SelectContent></Select>
            <div className="mx-1.5 h-5 w-px bg-zinc-200" />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100"><Heart className="h-[18px] w-[18px]" /><span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[9.5px] font-semibold leading-none text-white">2</span></span>
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100"><ShoppingCart className="h-[18px] w-[18px]" /><span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[9.5px] font-semibold leading-none text-white">3</span></span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100"><User className="h-[18px] w-[18px]" /></span>
          </div>
        </div>

        <div className="px-6 py-9 xl:px-10">
          <header className="mb-8">
            <span className="mb-2 inline-block text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">The Collection</span>
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-tight text-zinc-900 lg:text-[38px]">Clocks</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-zinc-500">Handcrafted pieces, curated with care — each one made to be lived with.</p>
          </header>
          <div className="mb-7 flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 hover:bg-zinc-100">Clocks <X className="h-3 w-3" /></button>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 hover:bg-zinc-100">4+ ★ <X className="h-3 w-3" /></button>
            <button className="ml-1 text-[12.5px] font-medium text-zinc-400 underline underline-offset-2 hover:text-zinc-700">Clear all</button>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-14 2xl:grid-cols-4">
            {products.map((p, i) => <ProductCardPro key={p.id} product={p as any} index={i} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
