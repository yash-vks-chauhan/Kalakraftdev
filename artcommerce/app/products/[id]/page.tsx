// File: app/products/[id]/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useCart } from '../../contexts/CartContext'
import WishlistButton from '../../components/WishlistButton'
import Link from 'next/link'
import styles from './product_details.module.css'

// SVG icons for navigation
const ChevronLeft = () => (
  <svg className={styles.navIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
  </svg>
)

const ChevronRight = () => (
  <svg className={styles.navIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
)

// New icon components for the sections
const SpecificationIcon = () => (
  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CareIcon = () => (
  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61C19.32 3.09 17.16 3.09 15.64 4.61L12 8.25L8.36 4.61C6.84 3.09 4.68 3.09 3.16 4.61C1.64 6.13 1.64 8.29 3.16 9.81L12 18.65L20.84 9.81C22.36 8.29 22.36 6.13 20.84 4.61Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor"/>
  </svg>
)

const StylingIcon = () => (
  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor"/>
  </svg>
)

interface Product {
  id: number
  name: string
  slug: string
  description: string
  shortDesc: string
  price: number
  currency: string
  imageUrls: string[]
  stockQuantity: number
  category: { id: number; name: string; slug: string } | null
  specifications?: string | null
  careInstructions?: string | null
  stylingIdeaImages?: ({ url: string; text?: string } | string)[] | null
}

export default function ProductDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id

  const { addToCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [similarProducts, setSimilarProducts] = useState<Product[]>([] as any)
  const [avgRating, setAvgRating] = useState<number>(0)
  const [ratingCount, setRatingCount] = useState<number>(0)
  const [reviews, setReviews] = useState<any[]>([])
  
  // New state for section toggles
  const [expandedSections, setExpandedSections] = useState({
    specifications: false,
    care: false,
    styling: true // Keep styling expanded by default
  })

  // Fetch product details on mount
  useEffect(() => {
    if (!id) {
      router.replace('/products')
      return
    }

    async function fetchProduct() {
      setLoading(true)
      setFetchError(null)

      try {
        const res = await fetch(`/api/products/${id}`, { cache: 'no-store' })
        if (!res.ok) {
          if (res.status === 404) {
            router.replace('/404')
            return
          }
          setFetchError(`Server error: ${res.status}`)
          return
        }
        const data = await res.json()
        // Normalize imageUrls in case they are stored as a JSON string
        const normalized = Array.isArray(data.product.imageUrls)
          ? data.product.imageUrls
          : (() => {
              try {
                const parsed = JSON.parse(data.product.imageUrls || '[]')
                return Array.isArray(parsed) ? parsed : []
              } catch {
                return []
              }
            })()

        setProduct({ ...data.product, imageUrls: normalized })
        // fetch similar products
        if (data.product?.category?.slug) {
          fetch(`/api/products?category=${data.product.category.slug}`)
            .then(r => r.json())
            .then(j => {
              const others = (j.products || []).filter((p: any) => p.id !== data.product.id).slice(0, 6)
              setSimilarProducts(others)
            })
            .catch(console.error)
        }
        setSelectedImage(0) // Reset selected image when product changes
      } catch (err: any) {
        console.error('Network error:', err)
        setFetchError('Network error—please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, router])

  // Fetch rating stats
  useEffect(() => {
    if (!id) return
    fetch(`/api/products/${id}/review`).then(r=>r.json()).then(({avg,count,reviews})=>{
      setAvgRating(avg)
      setRatingCount(count)
      setReviews(reviews||[])
    }).catch(()=>{})
  }, [id])

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Format specifications text
  const formatSpecifications = (text: string) => {
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return null
      
      // Check if it's a key-value pair (contains : or -)
      if (trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':')
        const value = valueParts.join(':').trim()
        return (
          <div key={index} className={styles.specRow}>
            <span className={styles.specKey}>{key.trim()}</span>
            <span className={styles.specValue}>{value}</span>
          </div>
        )
      } else if (trimmed.startsWith('-')) {
        return (
          <div key={index} className={styles.specBullet}>
            {trimmed.substring(1).trim()}
          </div>
        )
      } else {
        return (
          <div key={index} className={styles.specText}>
            {trimmed}
          </div>
        )
      }
    }).filter(Boolean)
  }

  // Loading state
  if (loading) {
    return (
      <main className={styles.container}>
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-32 bg-gray-100 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-100 rounded"></div>
            <div className="space-y-4">
              <div className="h-8 w-24 bg-gray-100 rounded"></div>
              <div className="h-12 w-3/4 bg-gray-100 rounded"></div>
              <div className="h-8 w-32 bg-gray-100 rounded"></div>
              <div className="h-24 w-full bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Error state
  if (fetchError) {
    return (
      <main className={styles.container}>
        <Link href="/products" className={styles.backLink}>
          ← Back to Products
        </Link>
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{fetchError}</p>
          <Link href="/products" className={styles.backLink}>
            Return to Products
          </Link>
        </div>
      </main>
    )
  }

  // Not found state
  if (!product) {
    return (
      <main className={styles.container}>
        <Link href="/products" className={styles.backLink}>
          ← Back to Products
        </Link>
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Product not found</p>
          <Link href="/products" className={styles.backLink}>
            Return to Products
          </Link>
        </div>
      </main>
    )
  }

  // Handle add to cart
  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const quantity = Number(qty)
    if (isNaN(quantity) || quantity < 1) {
      setError('Quantity must be at least 1')
      return
    }

    try {
      await addToCart(product.id, quantity)
      setAdded(true)
      setTimeout(() => {
        setAdded(false)
      }, 3000)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to add to cart')
    }
  }

  // Stock status
  const getStockStatus = () => {
    if (product.stockQuantity <= 0) return { text: 'Out of stock', className: styles.outOfStock }
    if (product.stockQuantity <= 5) return { text: `Only ${product.stockQuantity} left!`, className: styles.lowStock }
    return { text: 'In stock', className: styles.inStock }
  }
  const stockStatus = getStockStatus()

  const handlePrevImage = () => {
    setSelectedImage((prev) => 
      prev === 0 ? product!.imageUrls.length - 1 : prev - 1
    )
  }

  const handleNextImage = () => {
    setSelectedImage((prev) => 
      prev === product!.imageUrls.length - 1 ? 0 : prev + 1
    )
  }

  return (
    <main className={styles.container}>
      <Link href="/products" className={styles.backLink}>
        ← Back to Products
      </Link>

      {added && (
        <div className={styles.successBanner}>
          Product added to cart successfully
        </div>
      )}

      <div className={styles.productGrid}>
        {/* Left column: Images */}
        <div className={styles.imageSection}>
          <div className={styles.mainImageContainer}>
            {product.imageUrls[0] ? (
              <img
                src={product.imageUrls[selectedImage]}
                alt={product.name}
                className={`${styles.mainImage} ${styles.imageTransition}`}
                loading="lazy"
                key={selectedImage} // Force re-render for transition
              />
            ) : (
              <div className={styles.mainImage} style={{ 
                background: '#f8f8f8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px'
              }}>
                <span style={{ color: '#666666', fontSize: '0.9rem' }}>No image available</span>
              </div>
            )}

            {product.imageUrls.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className={`${styles.imageNav} ${styles.prevImage}`}
                  aria-label="Previous image"
                >
                  <ChevronLeft />
                </button>
                <button
                  onClick={handleNextImage}
                  className={`${styles.imageNav} ${styles.nextImage}`}
                  aria-label="Next image"
                >
                  <ChevronRight />
                </button>
              </>
            )}
          </div>

          {product.imageUrls.length > 1 && (
            <div className={styles.thumbnailGrid}>
              {product.imageUrls.map((url, index) => (
                <button
                  key={url}
                  onClick={() => setSelectedImage(index)}
                  className={styles.thumbnailButton}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={url}
                    alt={`${product.name} - View ${index + 1}`}
                    className={`${styles.thumbnail} ${index === selectedImage ? styles.thumbnailActive : ''}`}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Product info */}
        <div className={styles.productInfo}>
          <div className={styles.wishlistContainer}>
            <WishlistButton productId={product.id} className={styles.wishlistButton} />
          </div>

          {product.category && (
            <span className={styles.category}>{product.category.name}</span>
          )}
          
          <h1 className={styles.productTitle}>{product.name}</h1>
          <div style={{display:'flex',alignItems:'center',gap:'0.25rem',margin:'4px 0'}}>
            <span>
              {[1,2,3,4,5].map(i => (i <= Math.round(avgRating) ? '★' : '☆')).join('')}
            </span>
            <small>({ratingCount})</small>
          </div>
          
          <div className={styles.price}>
            <span className={styles.currency}>{product.currency}</span>
            {product.price.toFixed(2)}
          </div>

          <p className={styles.shortDesc}>{product.shortDesc}</p>
          
          <div className={styles.stockInfo}>
            <span className={stockStatus.className}>
              {stockStatus.text}
            </span>
          </div>

          {product.stockQuantity > 0 ? (
            <form onSubmit={handleAddToCart} className={styles.addToCartForm}>
              <div>
                <label htmlFor="qty" className={styles.qtyLabel}>Quantity</label>
                <input
                  id="qty"
                  type="number"
                  min={1}
                  max={product.stockQuantity}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className={styles.qtyInput}
                />
              </div>
              <button type="submit" className={styles.addToCartButton}>
                Add to Cart
              </button>
            </form>
          ) : (
            <button
              disabled
              className={styles.addToCartButton}
            >
              Out of Stock
            </button>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.descriptionSection}>
            <p className={styles.description}>{product.description}</p>
          </div>
        </div>
      </div>

      {/* Enhanced Product Details Sections */}
      <div className={styles.productDetails}>
        {/* Specifications Section */}
        {product.specifications && (
          <div className={styles.detailSection}>
            <button 
              className={`${styles.sectionHeader} ${styles.specHeader}`}
              onClick={() => toggleSection('specifications')}
              aria-expanded={expandedSections.specifications}
            >
              <div className={styles.sectionHeaderContent}>
                <SpecificationIcon />
                <h3 className={styles.sectionTitle}>Technical Specifications</h3>
              </div>
              <ChevronRight />
            </button>
            
            <div className={`${styles.sectionContent} ${expandedSections.specifications ? styles.expanded : ''}`}>
              <div className={`${styles.sectionInner} ${styles.specInner}`}>
                <div className={styles.specIntroContainer}>
                  <h4 className={styles.specIntroTitle}>Product Details</h4>
                  <p className={styles.specIntro}>
                    Precise specifications and measurements to help you understand the details of this piece.
                  </p>
                </div>
                <div className={styles.specGrid}>
                  {formatSpecifications(product.specifications)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Care & Maintenance Section */}
        {product.careInstructions && (
          <div className={styles.detailSection}>
            <button 
              className={`${styles.sectionHeader} ${styles.careHeader}`}
              onClick={() => toggleSection('care')}
              aria-expanded={expandedSections.care}
            >
              <div className={styles.sectionHeaderContent}>
                <CareIcon />
                <h3 className={styles.sectionTitle}>Care & Maintenance</h3>
              </div>
              <ChevronRight />
            </button>
            
            <div className={`${styles.sectionContent} ${expandedSections.care ? styles.expanded : ''}`}>
              <div className={`${styles.sectionInner} ${styles.careInner}`}>
                <div className={styles.careIntroContainer}>
                  <h4 className={styles.careIntroTitle}>Preserve Your Art</h4>
                  <p className={styles.careIntro}>
                    Follow these guidelines to maintain the beauty and quality of your piece for years to come.
                  </p>
                </div>
                <div className={styles.careContent}>
                  {product.careInstructions.split('\n').map((line, index) => {
                    const trimmed = line.trim()
                    if (!trimmed) return null
                    
                    return (
                      <div key={index} className={styles.careItem}>
                        <div className={styles.careBullet}></div>
                        <span>{trimmed.replace(/^[-•]?\s*/, '')}</span>
                      </div>
                    )
                  }).filter(Boolean)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Styling Ideas Section */}
        {product.stylingIdeaImages && product.stylingIdeaImages.length > 0 && (
          <div className={styles.detailSection}>
            <button 
              className={`${styles.sectionHeader} ${styles.stylingHeader}`}
              onClick={() => toggleSection('styling')}
              aria-expanded={expandedSections.styling}
            >
              <div className={styles.sectionHeaderContent}>
                <StylingIcon />
                <h3 className={styles.sectionTitle}>Styling Inspiration Gallery</h3>
              </div>
              <ChevronRight />
            </button>
            
            <div className={`${styles.sectionContent} ${expandedSections.styling ? styles.expanded : ''}`}>
              <div className={`${styles.sectionInner} ${styles.stylingInner}`}>
                <div className={styles.stylingIntroContainer}>
                  <h4 className={styles.stylingIntroTitle}>Visualize in Your Space</h4>
                  <p className={styles.stylingIntro}>
                    See how this piece transforms environments and creates stunning focal points in various settings.
                    Each image showcases the versatility of this artwork in different spaces.
                  </p>
                </div>
                
                <div className={`${styles.stylingGallery} ${
                    product.stylingIdeaImages?.length === 1 
                      ? styles.singleImage 
                      : product.stylingIdeaImages?.length === 2 
                        ? styles.twoImages 
                        : ''
                  }`}>
                  {product.stylingIdeaImages?.map((it, idx) => {
                    const obj = typeof it === 'string' ? { url: it, text: '' } : it
                    const defaultCaptions = [
                      "Living Room: Creates a calming focal point that ties the space together",
                      "Office Setting: Adds artistic flair to professional environments",
                      "Dining Area: Complements mealtime with artistic elegance"
                    ];
                    
                    // Determine the label based on image count
                    let spaceLabel = "Living Space";
                    const imageCount = product.stylingIdeaImages?.length || 0;
                    if (imageCount === 1) {
                      spaceLabel = "Featured Styling";
                    } else if (imageCount === 2) {
                      spaceLabel = idx === 0 ? "Living Space" : "Workspace";
                    } else {
                      spaceLabel = idx === 0 ? "Living Space" : idx === 1 ? "Workspace" : "Dining Area";
                    }
                    
                    return (
                      <div key={idx} className={styles.galleryItem}>
                        <div className={styles.galleryImageWrap}>
                          <img 
                            src={obj.url} 
                            alt={`Styling inspiration ${idx + 1}`} 
                            className={styles.galleryImage} 
                            loading="lazy" 
                          />
                          <div className={styles.galleryOverlay}>
                            <span className={styles.galleryLabel}>
                              {spaceLabel}
                            </span>
                          </div>
                        </div>
                        <div className={styles.galleryCaption}>
                          <p>{obj.text || defaultCaptions[idx % defaultCaptions.length]}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className={styles.stylingFooter}>
                  <p>Bring art into your everyday life with thoughtful placement and styling</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Similar products */}
      {similarProducts.length > 0 && (
        <section className={styles.similarSection}>
          <h2 className={styles.similarTitle}>You might also like</h2>
          <div className={styles.similarGrid}>
            {similarProducts.map(p => (
              <Link key={p.id} href={`/products/${p.id}`} className={styles.similarItem}>
                <div className={styles.similarImageContainer}>
                  <img src={p.imageUrls[0] || '/images/logo-mask.png'} alt={p.name} className={styles.similarImg} />
                </div>
                <div className={styles.similarInfo}>
                  <p className={styles.similarName}>{p.name}</p>
                  <p className={styles.similarPrice}>{p.currency}{p.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Link to view more similar products in this category */}
          {product.category && (
            <div className={styles.viewAllSimilarWrapper}>
              <Link href={`/products?category=${product.category.slug}`} className={styles.viewAllSimilarLink}>
                View all {product.category.name} products →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Reviews section */}
      {reviews.length>0 && (
        <section style={{marginTop:'2rem'}}>
          <h2 style={{fontSize:'1.25rem',fontWeight:'bold',marginBottom:'0.5rem'}}>Customer Reviews</h2>
          <ul style={{listStyle:'none',padding:0}}>
            {reviews.map((rev:any)=>(
              <li key={rev.id} style={{borderBottom:'1px solid #eee',padding:'0.75rem 0'}}>
                <p style={{margin:'0 0 4px'}}><strong>{rev.user?.fullName||'Anonymous'}</strong> – {[1,2,3,4,5].map(i=>i<=rev.rating?'★':'☆').join('')}</p>
                {rev.comment && <p style={{margin:0}}>{rev.comment}</p>}
                {rev.adminReaction && <p style={{margin:'2px 0'}}><span role="img" aria-label="reaction">{rev.adminReaction}</span></p>}
                {rev.adminReply && <p style={{margin:'2px 0', fontStyle:'italic',color:'#555'}}>Admin: {rev.adminReply}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}