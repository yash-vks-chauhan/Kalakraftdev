'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './mobile.module.css'
import { getImageUrl } from '../../../lib/cloudinaryImages'
import AOS from 'aos'
import 'aos/dist/aos.css'

export default function MobileHomePage() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)
  const [rotatingText, setRotatingText] = useState('coasters')
  const carouselTrackRef = useRef<HTMLDivElement>(null)
  const [isManualNav, setIsManualNav] = useState(false)
  const [slidePosition, setSlidePosition] = useState(0)
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Product categories for the grid
  const productCategories = [
    {
      image: getImageUrl('imagecollection1.png'),
      title: 'COASTERS',
      alt: 'Handcrafted resin coasters',
      link: '/products?category=coasters'
    },
    {
      image: getImageUrl('imageclock.png'),
      title: 'WALL ART',
      alt: 'Resin wall art pieces',
      link: '/products?category=wall-art'
    },
    {
      image: getImageUrl('imagecollection99.png'),
      title: 'HOME DECOR',
      alt: 'Decorative resin items',
      link: '/products?category=home-decor'
    },
    {
      image: getImageUrl('collectionwall.png'),
      title: 'CUSTOM PIECES',
      alt: 'Custom resin artwork',
      link: '/products?category=custom'
    },
    {
      image: getImageUrl('category1.png'),
      title: 'CLOCKS',
      alt: 'Handcrafted resin clocks',
      link: '/products?category=clocks'
    },
    {
      image: getImageUrl('trayscollection.png'),
      title: 'JEWELRY TRAYS',
      alt: 'Elegant resin jewelry trays',
      link: '/products?category=jewelry-trays'
    },
    {
      image: getImageUrl('vases.png'),
      title: 'VASES',
      alt: 'Decorative resin vases',
      link: '/products?category=vases'
    },
    {
      image: getImageUrl('category4.png'),
      title: 'TRAYS',
      alt: 'Stylish resin serving trays',
      link: '/products?category=trays'
    }
  ]

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false)
      } else {
        setShowScrollIndicator(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Rotating text animation
    const items = ['coasters', 'wall art', 'home decor', 'custom pieces']
    let currentIndex = 0

    const rotateText = () => {
      currentIndex = (currentIndex + 1) % items.length
      setRotatingText(items[currentIndex])
    }

    const interval = setInterval(rotateText, 3000)
    return () => clearInterval(interval)
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

    const cardWidth = 280; // Width of each card (smaller for mobile)
    const gap = 20; // Gap between cards (smaller for mobile)
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

  const handleScrollClick = () => {
    const productsSection = document.getElementById('products-section')
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className={styles.mobileHome}>
      {/* Hero Section */}
      <section className={styles.mobileHero}>
        <div className={styles.videoContainer}>
          {/* Video with fallback image */}
          <picture>
            {/* Fallback image that will be shown if video fails */}
            <img 
              src={getImageUrl('featured3.JPG')}
              alt="Handcrafted resin art" 
              className={styles.videoBackground}
              style={{ display: 'none' }}
              id="videoFallback"
            />
          </picture>

          <video
            className={styles.videoBackground}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setIsVideoLoaded(true)}
            poster={getImageUrl('loading.png')}
            onError={(e) => {
              // If video fails to load, show the fallback image
              const videoElement = e.currentTarget;
              videoElement.style.display = 'none';
              document.getElementById('videoFallback')!.style.display = 'block';
            }}
          >
            <source src="/images/homepage_video.mp4" type="video/mp4" />
          </video>
          <div className={styles.overlay} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.headerText}>
            <div className={styles.topText} data-aos="fade-in" data-aos-delay="200">
              A HANDCRAFTED ART STUDIO
            </div>
            <div className={styles.logoContainer}>
              <Image
                src={getImageUrl('logo.png')}
                alt="Artcommerce Logo"
                width={120}
                height={40}
                className={styles.logo}
                priority
              />
            </div>
            <h1 className={styles.heroTitle} data-aos="fade-up" data-aos-delay="400">
              Handcrafted resin art for <span id="rotator">{rotatingText}</span>
            </h1>
          </div>
          {showScrollIndicator && (
            <button 
              className={styles.scrollIndicator}
              onClick={handleScrollClick}
              aria-label="Scroll to products"
            >
              <ChevronDown size={24} />
            </button>
          )}
        </div>
      </section>

      {/* Products Grid Section */}
      <section id="products-section" className={styles.productsSection}>
        <div className={styles.sectionHeader} data-aos="fade-up">
          <div className={styles.headerLine}></div>
          <h2 className={styles.sectionTitle}>Our Collections</h2>
          <div className={styles.headerLine}></div>
        </div>

        <div className={styles.collectionDescription} data-aos="fade-up" data-aos-delay="100">
          <p>Discover our handcrafted resin art pieces, each one uniquely created with passion and precision. 
          Our collections showcase the perfect blend of artistic expression and functional elegance, 
          bringing the beauty of fluid art into your everyday life.</p>
        </div>

        <div className={styles.carouselContainer} data-aos="fade-up" data-aos-delay="200">
          <div 
            ref={carouselTrackRef}
            className={`${styles.carouselTrack} ${isManualNav ? styles.manualNav : ''}`}
            style={isManualNav ? { transform: `translateX(${slidePosition}px)` } : {}}
          >
            {/* First set of items */}
            {productCategories.map((category, index) => (
              <Link 
                href={category.link}
                key={`original-${index}`}
                className={styles.productCard}
              >
                <div className={styles.cardInner}>
                  <Image
                    src={category.image}
                    alt={category.alt}
                    width={280}
                    height={210}
                    className={styles.productImage}
                  />
                  <div className={styles.cardOverlay}>
                    <h3 className={styles.categoryTitle}>{category.title}</h3>
                  </div>
                </div>
              </Link>
            ))}

            {/* Duplicate set for seamless looping */}
            {productCategories.map((category, index) => (
              <Link 
                href={category.link}
                key={`duplicate-${index}`}
                className={styles.productCard}
              >
                <div className={styles.cardInner}>
                  <Image
                    src={category.image}
                    alt={category.alt}
                    width={280}
                    height={210}
                    className={styles.productImage}
                  />
                  <div className={styles.cardOverlay}>
                    <h3 className={styles.categoryTitle}>{category.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Navigation arrows */}
          <button 
            className={`${styles.carouselNav} ${styles.prevNav}`}
            onClick={() => handleCarouselNav('prev')}
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            className={`${styles.carouselNav} ${styles.nextNav}`}
            onClick={() => handleCarouselNav('next')}
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className={styles.collectionFooter} data-aos="fade-up" data-aos-delay="300">
          <p>Each piece tells a story through layers of color and texture, inviting you to bring the essence of artistic expression into your home.</p>
          <Link href="/products" className={styles.exploreAllButton}>
            View All Collections
          </Link>
        </div>
      </section>

      {/* Artistry Section */}
      <section className={styles.artistrySection}>
        <div 
          className={styles.artistryBackground}
          style={{
            backgroundImage: `linear-gradient(to right, rgba(248, 248, 248, 0.95), rgba(248, 248, 248, 0.8)), url('${getImageUrl('collectionwall.png')}')`
          }}
        >
          <Image 
            src={getImageUrl('DSC01366.JPG')}
            alt="Resin art creation process" 
            width={400}
            height={300}
            className={styles.artistryFeatureImage} 
            data-aos="fade-up"
          />
          
          <div className={styles.artistryContent}>
            <div className={styles.sectionHeader} data-aos="fade-up">
              <div className={styles.headerLine}></div>
              <h2 className={styles.sectionTitle}>Artistry in Every Layer</h2>
              <div className={styles.headerLine}></div>
            </div>
            
            <div className={styles.artistryQuote} data-aos="fade-up">
              Our resin art combines premium materials with meticulous craftsmanship to create pieces that capture light, color, and imagination in ways that will endure for generations.
            </div>
            
            <div className={styles.artistryCards}>
              {/* Card 1 */}
              <div className={styles.artistryCard} data-aos="fade-up">
                <div className={styles.artistryIcon}>
                  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="rgba(179, 138, 88, 0.8)" strokeWidth="1.5">
                    <path d="M32 8C32 8 16 24 16 40C16 48.8366 23.1634 56 32 56C40.8366 56 48 48.8366 48 40C48 24 32 8 32 8Z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M32 44C34.2091 44 36 42.2091 36 40C36 37.7909 32 32 32 32C32 32 28 37.7909 28 40C28 42.2091 29.7909 44 32 44Z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className={styles.artistryCardTitle}>Museum-Grade Resin</h3>
                <p className={styles.artistryCardText}>Hand-mixed for crystal clarity and vibrant hues that endure.</p>
              </div>
              
              {/* Card 2 */}
              <div className={styles.artistryCard} data-aos="fade-up">
                <div className={styles.artistryIcon}>
                  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="rgba(179, 138, 88, 0.8)" strokeWidth="1.5">
                    <path d="M8 24L32 32L56 24" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 32L32 40L56 32" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 40L32 48L56 40" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M32 16L16 22L32 28L48 22L32 16Z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className={styles.artistryCardTitle}>Precision Pouring</h3>
                <p className={styles.artistryCardText}>Controlled, bubble-free layers for a seamless, mirror-smooth surface.</p>
              </div>
              
              {/* Card 3 */}
              <div className={styles.artistryCard} data-aos="fade-up">
                <div className={styles.artistryIcon}>
                  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="rgba(179, 138, 88, 0.8)" strokeWidth="1.5">
                    <circle cx="32" cy="32" r="16" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M32 16V8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M32 56V48" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 32H8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M56 32H48" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M48 16L44 20" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 44L16 48" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M48 48L44 44" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 20L16 16" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M32 24V32H40" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className={styles.artistryCardTitle}>UV-Resistant Gloss</h3>
                <p className={styles.artistryCardText}>Anti-yellowing top coat protects color and shine from sun exposure.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 