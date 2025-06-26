// File: scripts/seed.js
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// 1️⃣ Define and upsert categories
const categories = [
  { name: 'Clocks',         slug: 'clocks' },
  { name: 'Pots',           slug: 'pots'   },
  { name: 'Trays',          slug: 'tray'   },
  { name: 'Jewelry Trays',  slug: 'Tray'   },
  { name: 'Rangoli',        slug: 'rangoli'},
  { name: 'Wall Decor',     slug: 'decor'  },
  { name: 'Matt Rangoli',   slug: 'matt rangoli' },
  { name: 'Mirror Work',    slug: 'mirror work' },
]

// 2️⃣ Define products with categorySlug rather than categoryId
const products = [
  {
    name: 'Ocean Whimsy Resin Wall Clock',
    slug: 'wall-clock-product',
    description: 'Bring the beauty of the ocean to your wall with this handcrafted clock.',
    shortDesc: 'A charming resin clock',
    price: 799,
    currency: 'INR',
    imageUrls: ['/images/DSC01393.JPG'],
    stockQuantity: 10,
    isActive: true,
    categorySlug: 'clocks',
  },
  {
    name: 'Midnight Marble Resin Wall Clock – Elegant Black & Gold Design',
    slug: 'midnight-marble-clock',
    description: 'Add a bold statement to your décor with the Midnight Marble Resin Wall Clock, an elegant fusion of art and functionality. Handcrafted using premium epoxy resin and alcohol ink, this luxurious timepiece showcases a stunning marbled swirl of deep black, gold, and white — resembling a dramatic night sky or abstract marble stone. Golden Roman numerals and sleek matching clock hands enhance the luxurious aesthetic, making it a perfect centerpiece for modern, minimalist, or high-end interiors. Every clock is one-of-a-kind, with natural fluid art patterns that cannot be replicated, giving your space a touch of exclusivity and sophistication.',
    shortDesc: 'Handcrafted with resin and alcohol ink, this elegant black and gold wall clock features a luxurious marbled design with golden Roman numerals. A striking statement piece for modern and sophisticated spaces.',
    price: 1599,
    currency: 'INR',
    imageUrls: [
      '/images/DSC01414.JPG',
      '/images/DSC01405.JPG',
      '/images/DSC01396.JPG',
    ],
    stockQuantity: 7,
    isActive: true,
    categorySlug: 'clocks',
  },
  {
    name: 'Desert Mirage Resin Wall Clock – Earthy Sand & Teal Design',
    slug: 'Desert-Mirage-clock',
    description: 'Add a bold statement to your décor with the Midnight Marble Resin Wall Clock, an elegant fusion of art and functionality. Handcrafted using premium epoxy resin and alcohol ink, this luxurious timepiece showcases a stunning marbled swirl of deep black, gold, and white — resembling a dramatic night sky or abstract marble stone. Golden Roman numerals and sleek matching clock hands enhance the luxurious aesthetic, making it a perfect centerpiece for modern, minimalist, or high-end interiors. Every clock is one-of-a-kind, with natural fluid art patterns that cannot be replicated, giving your space a touch of exclusivity and sophistication.',
    shortDesc: 'A handcrafted resin wall clock inspired by desert landscapes, featuring earthy sand tones, textured rock-like accents, and bold teal highlights. A stunning blend of nature and art.',
    price: 1599,
    currency: 'INR',
    imageUrls: [
      '/images/DSC01472.JPG',
      '/images/DSC01474.JPG',
      '/images/DSC01486.JPG',
    ],
    stockQuantity: 7,
    isActive: true,
    categorySlug: 'clocks',
  },
  {
    name: 'Amber Dusk Resin Wall Clock – Warm Earth Tones with Elegant Gold Detailing',
    slug: 'amber-dusk-resin-wall-clock',
    description: 'Infuse your space with warmth and sophistication with the Amber Dusk Resin Wall Clock. Inspired by the golden hour and natural earthy textures, this handcrafted timepiece features deep amber, creamy ivory, and rich chocolate swirls—each layer flowing like a painted sunset. The gleaming gold Roman numerals and delicately styled hands add a touch of vintage charm, while the glossy epoxy finish gives it a luxurious shine. Whether placed in a living room, study, or entryway, this piece brings a sense of calm and timeless elegance.',
    shortDesc: 'A handcrafted resin wall clock blending rich amber, chocolate, and ivory tones with golden Roman numerals. This piece radiates warmth and elegance—perfect for cozy, rustic, or classic interiors.',
    price: 1699,
    currency: 'INR',
    imageUrls: [
      '/images/DSC01424.JPG',
      '/images/DSC01432.JPG',
      '/images/DSC01435.JPG',
    ],
    stockQuantity: 7,
    isActive: true,
    categorySlug: 'clocks',
  },
  {
    name: 'Floral Ember Oval Jewelry Tray',
    slug: 'floral-ember-oval-jewelry-tray',
    description: `\nAdd a touch of handcrafted charm to your space with this Floral Ember Oval Jewelry Tray. Made from high-quality white cement, this tray is not only sturdy but also beautifully designed with marbled orange tones and a striking floral motif at the center.\n\nPerfect for organizing your rings, earrings, bangles, or small trinkets, this tray blends functionality with style. Whether placed on your vanity, bedside table, or bathroom shelf, it keeps your everyday essentials in one elegant spot.\n\nEach piece is handmade, so slight variations in pattern and color make every tray one of a kind — just like your jewelry.\n\nDetails:\n\n• Handcrafted with durable white cement  \n• Oval shape with smooth, polished edges  \n• Floral design sealed under a glossy finish  \n• Ideal for rings, bangles, earrings, and other small accessories  \n• Size: [Insert dimensions here]  \n• Wipe clean with a soft, damp cloth  \n\n✨ Great as a gift or a personal treat for your jewelry collection!\n`,
    shortDesc: 'A handcrafted oval jewelry tray made of white cement, adorned with a rich floral design and fiery orange hues — perfect for organizing your daily wear rings, bangles, and trinkets.',
    price: 1699,
    currency: 'INR',
    imageUrls: [
      '/images/DSC01373.JPG',
      '/images/DSC01386.JPG',
      '/images/DSC01382.JPG',
    ],
    stockQuantity: 7,
    isActive: true,
    categorySlug: 'Tray',
  },
  {
    name: 'Lotus Bloom Wood & Resin Serving Tray',
    slug: 'lotus-bloom-wood-resin-serving-tray',
    description: `Bring elegance and color to your home with our Lotus Bloom Wood & Resin Serving Tray. This round tray is carefully handcrafted from high-quality wood and topped with a vibrant lotus floral design preserved in clear, glossy epoxy resin. The combination of natural wood and smooth resin gives it a luxurious feel—perfect for serving drinks, snacks, or simply elevating your home décor.\n\nWith its cut-out handles for easy carrying and a water-resistant finish, it's as functional as it is beautiful. Whether for everyday use or festive occasions, this tray makes a statement in any setting.\n\n✨ Features:\n\nMade from premium wood and epoxy resin\n\nStunning lotus floral artwork sealed under clear resin\n\nSmooth, glossy, and water-resistant surface\n\nErgonomic side handles for easy grip\n\nIdeal for serving or as a decorative centerpiece\n\n📐 Dimensions (Approx.):\n30 cm diameter × 4 cm height\n\n🎁 Perfect For:\nHome décor, housewarming gifts, serving tea or snacks, festive table setups`,
    shortDesc: 'Elegant round tray handcrafted from wood and resin, featuring vibrant lotus flowers sealed in glossy epoxy.',
    price: 1999,
    currency: 'INR',
    imageUrls: [
      '/images/DSC01336.JPG',
      '/images/DSC01340.JPG',
      '/images/DSC01344.JPG',
    ],
    stockQuantity: 7,
    isActive: true,
    categorySlug: 'tray',
  },
  {
    name: 'Rosé Luxe Petal Tray',
    slug: 'rose-luxe-petal-tray',
    description: `Add a romantic and refined charm to your space with the Rosé Luxe Petal Tray — a handcrafted resin masterpiece inspired by the soft elegance of flower petals. With its delicate blush pink tones, shimmering crushed crystal accents, and hand-painted gold edges, this tray is both a statement piece and a functional beauty.\n\nWhether you're serving guests, organizing your vanity, or decorating your table, this tray elevates every moment. Crafted entirely from high-quality resin, it features gently curved petal-like edges and sturdy resin handles, making it as practical as it is gorgeous.\n\n✨ Features:\n\n100% handcrafted from premium epoxy resin\n\nUnique petal-inspired shape with organic, flowing edges\n\nSoft blush pink base with embedded crystal accents\n\nHand-painted gold edging for a luxe finish\n\nBuilt-in resin handles for easy carrying\n\nWater-resistant, easy to clean, and durable\n\n📐 Dimensions (Approx.):\n25 cm × 25 cm (shape may vary slightly due to handcrafted design)\n\n🎁 Perfect For:\nVanity décor, festive gifting, jewelry display, luxury serving, centerpieces, or housewarmings`,
    shortDesc: 'Elegant petal-shaped resin tray in blush pink with crystal accents and gold detailing — a touch of luxury for any space.',
    price: 1999,
    currency: 'INR',
    imageUrls: [
      '/images/DSC01328.JPG',
      '/images/DSC01327.JPG',
      '/images/DSC01322.JPG',
    ],
    stockQuantity: 7,
    isActive: true,
    categorySlug: 'tray',
  },
]

async function main() {
  // Upsert categories first
  console.log(`⏳ Seeding ${categories.length} categories…`)
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug },
    })
  }
  console.log('✅ Categories seeded.')

  // Upsert products
  console.log(`⏳ Seeding ${products.length} products…`)
  for (const p of products) {
    const { categorySlug, ...rest } = p
    await prisma.product.upsert({
      where: { slug: rest.slug },
      update: {
        ...rest,
        category: { connect: { slug: categorySlug } },
      },
      create: {
        ...rest,
        category: { connect: { slug: categorySlug } },
      },
    })
    console.log(`🔄 Upserted product: ${rest.slug}`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeder failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
