'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getImageUrl } from '../../../lib/cloudinaryImages'
import SectionHeader from './SectionHeader'
import Reveal from './Reveal'

// Category slugs mirror the filters the products page already understands
// (same mapping the navbar mega menu uses).
const TILES = [
  {
    name: 'Clocks',
    slug: 'clocks',
    image: getImageUrl('category1.png'),
    alt: 'Handcrafted resin clocks',
  },
  {
    name: 'Wall Art',
    slug: 'decor',
    image: 'https://ik.imagekit.io/4pjvf8k9u/Videos/imageclock.png?updatedAt=1754677566365',
    alt: 'Resin wall art pieces',
  },
  {
    name: 'Trays',
    slug: 'tray',
    image: getImageUrl('category4.png'),
    alt: 'Stylish resin serving trays',
  },
  {
    name: 'Jewelry Trays',
    slug: 'Tray',
    image: 'https://ik.imagekit.io/4pjvf8k9u/Videos/trayscollection.png?updatedAt=1754677551492',
    alt: 'Elegant resin jewelry trays',
  },
  {
    name: 'Pots & Vases',
    slug: 'pots',
    image: 'https://ik.imagekit.io/4pjvf8k9u/Videos/vases.png?updatedAt=1754677551331',
    alt: 'Decorative resin vases',
  },
  {
    name: 'Rangoli',
    slug: 'rangoli',
    image: getImageUrl('category8.png'),
    alt: 'Traditional rangoli art',
  },
]

export default function CategoryTiles() {
  return (
    <section id="collections" className="bg-white">
      <div className="mx-auto max-w-7xl px-10 py-28 2xl:px-4">
        <Reveal>
          <SectionHeader
            eyebrow="Collections"
            title="Shop by category"
            sub="Six ways to bring the studio home — every collection handcrafted in small batches."
            action={{ href: '/products', label: 'View all products' }}
          />
        </Reveal>

        <div className="mt-14 grid grid-cols-3 gap-6">
          {TILES.map((tile, i) => (
            <Reveal key={tile.slug + tile.name} delay={(i % 3) * 0.08}>
              <Link
                href={`/products?category=${encodeURIComponent(tile.slug)}`}
                className="group relative block overflow-hidden rounded-2xl border border-[#e5e5e5] bg-[#fafafa]"
              >
                <img
                  src={tile.image}
                  alt={tile.alt}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover grayscale-[0.9] transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:grayscale-0"
                  onError={e => {
                    e.currentTarget.src = 'https://placehold.co/600x750/f0f0f0/999?text=Kalakraft'
                  }}
                />

                {/* Frosted name strip */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/60 bg-white/75 px-5 py-4 backdrop-blur-md">
                  <span className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]">
                    {tile.name}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[#666] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#1a1a1a]" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
