'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import styles from './home.module.css'
import { getImageUrl } from '../lib/cloudinaryImages'
import Link from 'next/link'
import { DataCache } from '../lib/dataCache'
import WishlistButton from './components/WishlistButton'
import HomeHero from './components/home/HomeHero'
import MobileHome from './components/home/mobile/MobileHome'
import CollectionsIndex from './components/home/CollectionsIndex'
import FeaturedPieces from './components/home/FeaturedPieces'
import MarqueeDivider from './components/home/MarqueeDivider'
import CraftSection from './components/home/CraftSection'
import CtaBand from './components/home/CtaBand'
import HomeFooter from './components/home/HomeFooter'


// Mobile Featured Categories Skeleton Component
const MobileFeaturedCategoriesSkeleton = () => {
  return (
    <div className={`${styles.featuredCategoriesSection} ${styles.mobileOnly}`}>
      {/* Section Header Skeleton */}
      <div className={styles.sectionHeader}>
        <div className={styles.headerLine}></div>
        <div className={`${styles.skeletonTitle} ${styles.skeletonShimmer}`}></div>
        <div className={styles.headerLine}></div>
      </div>

      <div className={styles.featuredDescription}>
        <div className={`${styles.skeletonDescription} ${styles.skeletonShimmer}`}></div>
      </div>

      {/* Category Buttons Skeleton */}
      <div className={styles.categoryButtonsContainer}>
        {[1, 2, 3, 4].map((_, index) => (
          <div key={index} className={`${styles.skeletonCategoryButton} ${styles.skeletonShimmer}`}></div>
        ))}
      </div>

      {/* Products Grid Skeleton */}
      <div className={styles.featuredProductsContainer}>
        <div className={`${styles.featuredProductsMobile} ${styles.mobileOnly}`}>
          <div className={styles.featuredProductsMobileGrid}>
            {[1, 2, 3, 4].map((_, index) => (
              <div key={index} className={styles.featuredMobileCard}>
                <div className={styles.featuredMobileCardWrapper}>
                  <div className={styles.featuredMobileImageContainer}>
                    <div className={`${styles.skeletonImage} ${styles.skeletonShimmer}`}></div>
                  </div>
                  
                  <div className={styles.featuredMobileCardInfo}>
                    <div className={`${styles.skeletonProductName} ${styles.skeletonShimmer}`}></div>
                    <div className={`${styles.skeletonPrice} ${styles.skeletonShimmer}`}></div>
                  </div>
                  
                  {/* Wishlist Button Skeleton */}
                  <div className={styles.featuredMobileWishlistContainer}>
                    <div className={`${styles.skeletonWishlistButton} ${styles.skeletonShimmer}`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Explore Section Skeleton Component
const MobileExploreSkeleton = () => {
  return (
    <section className={`${styles.mobileExploreSection} ${styles.mobileOnly}`} style={{ padding: '5rem 1.5rem 6rem' }}>
      {/* Header skeleton */}
      <div className={styles.mobileExploreHeader}>
        <div className={styles.headerLine}></div>
        <div className={`${styles.skeletonTitle} ${styles.skeletonShimmer}`}></div>
        <div className={styles.headerLine}></div>
        <div className={`${styles.skeletonDescription} ${styles.skeletonShimmer}`} style={{
          width: '300px',
          height: '16px',
          margin: '1.5rem auto 0',
          borderRadius: '2px'
        }}></div>
      </div>

      {/* Grid skeleton */}
      <div className={styles.mobileExploreGrid}>
        {[1, 2, 3, 4, 5, 6].map((_, index) => (
          <div key={index} className={styles.mobileExploreCard}>
            <div className={styles.mobileExploreCardInner}>
              <div className={`${styles.skeletonImage} ${styles.skeletonShimmer}`} style={{
                width: '100%',
                height: '140px',
                borderRadius: '6px'
              }}></div>
              <div className={styles.mobileExploreCardContent}>
                <div className={`${styles.skeletonProductName} ${styles.skeletonShimmer}`} style={{
                  width: '80%',
                  height: '16px',
                  margin: '0 auto'
                }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Button skeleton */}
      <div style={{
        textAlign: 'center',
        marginTop: '3.5rem',
        position: 'relative',
        zIndex: 2
      }}>
        <div className={`${styles.skeletonButton} ${styles.skeletonShimmer}`} style={{
          width: '160px',
          height: '44px',
          margin: '0 auto',
          borderRadius: '22px'
        }}></div>
      </div>
    </section>
  );
};

export default function Home() {
const [featuredProducts, setFeaturedProducts] = useState([]);


const carouselTrackRef = useRef<HTMLDivElement>(null)

const [isManualNav, setIsManualNav] = useState(false)

const [slidePosition, setSlidePosition] = useState(0)

const resumeTimerRef = useRef<NodeJS.Timeout | null>(null)


// Product categories for the grid - expanded with more items

const productCategories = [

{

image: getImageUrl('imagecollection1.png'),

title: 'COASTERS',

alt: 'Handcrafted resin coasters'

},

{

image: 'https://ik.imagekit.io/4pjvf8k9u/Videos/imageclock.png?updatedAt=1754677566365',

title: 'WALL ART',

alt: 'Resin wall art pieces'

},

{

image: getImageUrl('imagecollection99.png'),

title: 'HOME DECOR',

alt: 'Decorative resin items'

},

{

image: 'https://ik.imagekit.io/4pjvf8k9u/Videos/collectionwall.png?updatedAt=1754677551540',

title: 'CUSTOM PIECES',

alt: 'Custom resin artwork'

},

{

image: getImageUrl('category1.png'),

title: 'CLOCKS',

alt: 'Handcrafted resin clocks'

},

{

image: 'https://ik.imagekit.io/4pjvf8k9u/Videos/trayscollection.png?updatedAt=1754677551492',

title: 'JEWELRY TRAYS',

alt: 'Elegant resin jewelry trays'

},

{

image: 'https://ik.imagekit.io/4pjvf8k9u/Videos/vases.png?updatedAt=1754677551331',

title: 'VASES',

alt: 'Decorative resin vases'

},

{

image: getImageUrl('category4.png'),

title: 'TRAYS',

alt: 'Stylish resin serving trays'

}

]


useEffect(() => {

// Add required fonts

const fonts = [

'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&display=swap',

'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap'

]


const links = fonts.map(font => {

const link = document.createElement('link')

link.href = font

link.rel = 'stylesheet'

document.head.appendChild(link)

return link

})


return () => {

links.forEach(link => document.head.removeChild(link))


}

}, [])

// Handle carousel navigation

const handleCarouselNav = (direction: 'prev' | 'next') => {

if (!carouselTrackRef.current) return;


// If this is the first manual navigation, stop the auto-scrolling

if (!isManualNav) {

setIsManualNav(true);

}


// Clear any existing timer to reset the idle timeout

if (resumeTimerRef.current) {

clearTimeout(resumeTimerRef.current)

}


const cardWidth = 380; // Width of each card

const gap = 40; // Gap between cards (2.5rem)

const containerWidth = carouselTrackRef.current.parentElement?.clientWidth || 0;

const totalWidth = productCategories.length * (cardWidth + gap);


// Calculate the step size (one card width + gap)

const step = cardWidth + gap;


// Update the position based on direction

let newPosition = slidePosition;

if (direction === 'next') {

newPosition = Math.max(slidePosition - step, -totalWidth + containerWidth);

} else {

newPosition = Math.min(slidePosition + step, 0);

}


setSlidePosition(newPosition);


// Set a timer to resume auto-scrolling after 5 seconds of inactivity

resumeTimerRef.current = setTimeout(() => {

setIsManualNav(false)

}, 5000) // 5 seconds


// Apply the transform

carouselTrackRef.current.style.transform = `translateX(${newPosition}px)`;

}


// Cleanup timer on component unmount

useEffect(() => {

return () => {

if (resumeTimerRef.current) {

clearTimeout(resumeTimerRef.current)

}

}

}, [])


useEffect(() => {

AOS.init({

duration: 800,

once: true,

easing: 'ease-in-out',

})

}, [])


// Fetch featured products for mobile carousel from cache
useEffect(() => {
  const fetchFeaturedProducts = async () => {
    try {
      // Try to get precomputed featured products from cache first
      const cachedFeatured = await DataCache.getFeaturedProducts();
      
      if (cachedFeatured && cachedFeatured.length > 0) {
        setFeaturedProducts(cachedFeatured);
        return;
      }
      
      // Fallback: compute from cached products
      const cachedProducts = await DataCache.getProducts();
      
      if (cachedProducts && Array.isArray(cachedProducts)) {
        // Get active products with stock and images
        let availableProducts = cachedProducts
          .filter(p => p.isActive && p.imageUrls && p.imageUrls.length > 0)
          .map(p => ({
            ...p,
            imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [p.imageUrls]
          }));
          
        // Ensure we always have exactly 8 products for the circular carousel
        if (availableProducts.length >= 8) {
          // Shuffle products randomly and take 8
          const shuffled = [...availableProducts].sort(() => Math.random() - 0.5);
          availableProducts = shuffled.slice(0, 8);
        } else if (availableProducts.length > 0) {
          // Shuffle available products first, then repeat to make 8
          const shuffled = [...availableProducts].sort(() => Math.random() - 0.5);
          availableProducts = [...shuffled];
          while (availableProducts.length < 8) {
            availableProducts = [...availableProducts, ...shuffled];
          }
          availableProducts = availableProducts.slice(0, 8);
        }
          
        setFeaturedProducts(availableProducts);
      }
    } catch (error) {
      console.error('Error loading featured products:', error);
    }
  };
  
  fetchFeaturedProducts();
}, []);


return (

<main data-page="home" style={{background: '#f8f8f8'}}>


{/* ================================================================ */}
{/* Desktop homepage — monochrome gallery redesign (shadcn styling)  */}
{/* ================================================================ */}
<div className={styles.desktopOnly}>
  <HomeHero />
  {/* The hero is sticky: everything below rides over it like a curtain,
      so this wrapper needs a solid background and a higher z-index. */}
  <div className="relative z-10 bg-white">
    <CollectionsIndex />
    <FeaturedPieces />
    <MarqueeDivider />
    <CraftSection />
    <CtaBand />
    <HomeFooter />
  </div>
</div>

{/* ================================================================ */}
{/* Mobile homepage — marketplace layout on shadcn primitives        */}
{/* ================================================================ */}
<div className={styles.mobileOnly}>
  <MobileHome />
</div>

</main>

)

}
