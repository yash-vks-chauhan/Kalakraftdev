'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import styles from './mobile.module.css'
import { getImageUrl } from '../../../lib/cloudinaryImages'

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

export default function MobileHomePage() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)

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

  const handleScrollClick = () => {
    const productsSection = document.getElementById('products-section')
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className={styles.mobileHome}>
      {/* Hero Section */}
      <div className={styles.mobileHero}>
        <div className={styles.videoContainer}>
          <video
            className={styles.videoBackground}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setIsVideoLoaded(true)}
            poster={getImageUrl('loading.png')}
          >
            <source src="/images/homepage_video.mp4" type="video/mp4" />
          </video>
          <div className={styles.overlay} />
        </div>

        <div className={styles.heroContent}>
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
          <h1 className={styles.heroTitle}>
            Handcrafted Art for Your Home
          </h1>
          <p className={styles.heroTagline}>
            Unique pieces that tell your story
          </p>
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
      </div>

      {/* Products Grid Section */}
      <section id="products-section" className={styles.productsSection}>
        <h2 className={styles.sectionTitle}>Our Collections</h2>
        <div className={styles.productGrid}>
          {productCategories.map((category, index) => (
            <Link 
              href={category.link}
              key={index}
              className={styles.productCard}
            >
              <div className={styles.productImageContainer}>
                <Image
                  src={category.image}
                  alt={category.alt}
                  width={300}
                  height={225}
                  className={styles.productImage}
                />
                <div className={styles.productOverlay}>
                  <h3 className={styles.productTitle}>{category.title}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Section */}
      <section className={styles.featuredSection}>
        <h2 className={styles.sectionTitle}>Featured Pieces</h2>
        <div className={styles.featuredGrid}>
          <div className={styles.featuredItem}>
            <Image
              src={getImageUrl('featured1.png')}
              alt="Featured resin art piece"
              width={400}
              height={300}
              className={styles.featuredImage}
            />
            <div className={styles.featuredContent}>
              <h3>Handcrafted Excellence</h3>
              <p>Each piece is carefully crafted to bring unique beauty to your space</p>
            </div>
          </div>
          <div className={styles.featuredItem}>
            <Image
              src={getImageUrl('featured2.png')}
              alt="Custom resin artwork"
              width={400}
              height={300}
              className={styles.featuredImage}
            />
            <div className={styles.featuredContent}>
              <h3>Custom Creations</h3>
              <p>Let us bring your vision to life with personalized pieces</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className={styles.ctaSection}>
        <h2>Ready to Transform Your Space?</h2>
        <Link href="/products" className={styles.ctaButton}>
          Explore All Products
        </Link>
      </section>
    </div>
  )
} 