'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'
import Link from 'next/link'
import { Heart, ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag, Star, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react'
import styles from './mobile.module.css'

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

export default function MobileProductDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params.id

  const { addToCart } = useCart()
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist()

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
  
  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    description: false,
    specifications: false,
    care: false,
    styling: false
  })

  // Check if product is in wishlist
  const isInWishlist = product ? wishlistItems.some(item => item.id === product.id) : false

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
        
        // Normalize imageUrls and filter out any null/invalid entries
        let rawImgs: (string | null)[] = [];
        if (Array.isArray(data.product.imageUrls)) {
          rawImgs = data.product.imageUrls;
        } else {
          try {
            const parsed = JSON.parse(data.product.imageUrls || '[]');
            if (Array.isArray(parsed)) {
              rawImgs = parsed;
            }
          } catch {
            // Fails silently, rawImgs remains []
          }
        }
        
        const cleanImageUrls = rawImgs.filter((url): url is string => typeof url === 'string' && url.length > 0);
        
        setProduct({ ...data.product, imageUrls: cleanImageUrls })
        // fetch similar products
        if (data.product?.category?.slug) {
          fetch(`/api/products?category=${data.product.category.slug}`)
            .then(r => r.json())
            .then(j => {
              const others = (j.products || []).filter((p: any) => p.id !== data.product.id).slice(0, 4)
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

  // Handle add to cart
  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    try {
      await addToCart(product.id, qty)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to add to cart')
      setTimeout(() => setError(null), 3000)
    }
  }

  // Handle wishlist toggle
  const handleWishlistToggle = () => {
    if (!product) return
    
    if (isInWishlist) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product.id)
    }
  }

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Format price with currency symbol
  const formatPrice = (price: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
    })
    return formatter.format(price)
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.mobileProductDetail}>
        <div className={styles.loadingContainer}>
          <Image
            src="/images/loading.png"
            alt="Loading..."
            width={50}
            height={50}
            className={styles.loadingSpinner}
          />
        </div>
      </div>
    )
  }

  // Error state
  if (fetchError || !product) {
    return (
      <div className={styles.mobileProductDetail}>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{fetchError || 'Product not found'}</p>
          <button 
            className={styles.backButton}
            onClick={() => router.back()}
          >
            <ArrowLeft size={18} />
            <span>Back to Products</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.mobileProductDetail}>
      {/* Product Images */}
      <div className={styles.productImageSlider}>
        <div className={styles.imageContainer}>
          {product.imageUrls.length > 0 ? (
            <Image
              src={product.imageUrls[selectedImage]}
              alt={product.name}
              fill
              sizes="100vw"
              priority
              className={styles.productDetailImage}
            />
          ) : (
            <div className={styles.noProductImage}>No Image Available</div>
          )}
          
          {/* Image navigation */}
          {product.imageUrls.length > 1 && (
            <>
              <button 
                className={`${styles.imageNavButton} ${styles.prevButton}`}
                onClick={() => setSelectedImage((prev) => (prev === 0 ? product.imageUrls.length - 1 : prev - 1))}
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                className={`${styles.imageNavButton} ${styles.nextButton}`}
                onClick={() => setSelectedImage((prev) => (prev === product.imageUrls.length - 1 ? 0 : prev + 1))}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
        
        {/* Image indicators */}
        {product.imageUrls.length > 1 && (
          <div className={styles.imageIndicators}>
            {product.imageUrls.map((_, index) => (
              <button
                key={index}
                className={`${styles.imageIndicator} ${selectedImage === index ? styles.activeIndicator : ''}`}
                onClick={() => setSelectedImage(index)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className={styles.productInfo}>
        <h1 className={styles.productName}>{product.name}</h1>
        
        <div className={styles.productMeta}>
          <div className={styles.productPrice}>
            {formatPrice(product.price, product.currency)}
          </div>
          
          {product.category && (
            <div className={styles.productCategory}>
              {product.category.name}
            </div>
          )}
        </div>
        
        {/* Rating */}
        <div className={styles.ratingContainer}>
          <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                fill={star <= Math.round(avgRating) ? "#FFD700" : "none"}
                color={star <= Math.round(avgRating) ? "#FFD700" : "#CBD5E0"}
              />
            ))}
          </div>
          <span className={styles.ratingText}>
            {avgRating.toFixed(1)} ({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>
        
        {/* Stock Status */}
        <div className={styles.stockStatus}>
          {product.stockQuantity > 5 ? (
            <span className={styles.inStock}>In Stock</span>
          ) : product.stockQuantity > 0 ? (
            <span className={styles.lowStock}>Low Stock - Only {product.stockQuantity} left</span>
          ) : (
            <span className={styles.outOfStock}>Out of Stock</span>
          )}
        </div>
        
        {/* Description Section */}
        <div className={styles.productSection}>
          <button 
            className={styles.sectionHeader}
            onClick={() => toggleSection('description')}
          >
            <h2>Description</h2>
            {expandedSections.description ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </button>
          
          {expandedSections.description && (
            <div className={styles.sectionContent}>
              <p className={styles.productDescription}>{product.description}</p>
            </div>
          )}
        </div>
        
        {/* Specifications Section */}
        {product.specifications && (
          <div className={styles.productSection}>
            <button 
              className={styles.sectionHeader}
              onClick={() => toggleSection('specifications')}
            >
              <h2>Specifications</h2>
              {expandedSections.specifications ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
            
            {expandedSections.specifications && (
              <div className={styles.sectionContent}>
                <div className={styles.specifications}>
                  {product.specifications.split('\n').map((line, index) => {
                    const trimmed = line.trim()
                    if (!trimmed) return null
                    
                    if (trimmed.includes(':')) {
                      const [key, ...valueParts] = trimmed.split(':')
                      const value = valueParts.join(':').trim()
                      return (
                        <div key={index} className={styles.specRow}>
                          <span className={styles.specKey}>{key.trim()}</span>
                          <span className={styles.specValue}>{value}</span>
                        </div>
                      )
                    } else {
                      return (
                        <div key={index} className={styles.specText}>
                          {trimmed}
                        </div>
                      )
                    }
                  }).filter(Boolean)}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Care Instructions Section */}
        {product.careInstructions && (
          <div className={styles.productSection}>
            <button 
              className={styles.sectionHeader}
              onClick={() => toggleSection('care')}
            >
              <h2>Care Instructions</h2>
              {expandedSections.care ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
            
            {expandedSections.care && (
              <div className={styles.sectionContent}>
                <p className={styles.careInstructions}>{product.careInstructions}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Styling Ideas Section */}
        {product.stylingIdeaImages && product.stylingIdeaImages.length > 0 && (
          <div className={styles.productSection}>
            <button 
              className={styles.sectionHeader}
              onClick={() => toggleSection('styling')}
            >
              <h2>Styling Ideas</h2>
              {expandedSections.styling ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
            
            {expandedSections.styling && (
              <div className={styles.sectionContent}>
                <div className={styles.stylingIdeas}>
                  {product.stylingIdeaImages.map((item, index) => {
                    const imageUrl = typeof item === 'string' ? item : item.url
                    const caption = typeof item === 'string' ? null : item.text
                    
                    return (
                      <div key={index} className={styles.stylingImageContainer}>
                        <Image
                          src={imageUrl}
                          alt={`Styling idea ${index + 1}`}
                          width={300}
                          height={300}
                          className={styles.stylingImage}
                        />
                        {caption && <p className={styles.stylingCaption}>{caption}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className={styles.similarProductsSection}>
          <h2 className={styles.similarProductsTitle}>You May Also Like</h2>
          <div className={styles.similarProductsGrid}>
            {similarProducts.map(product => (
              <Link 
                key={product.id} 
                href={`/products/${product.slug}`}
                className={styles.similarProductCard}
              >
                <div className={styles.similarProductImageContainer}>
                  {product.imageUrls && product.imageUrls.length > 0 ? (
                    <Image
                      src={product.imageUrls[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className={styles.similarProductImage}
                    />
                  ) : (
                    <div className={styles.noSimilarProductImage}>No Image</div>
                  )}
                </div>
                <div className={styles.similarProductInfo}>
                  <h3 className={styles.similarProductName}>{product.name}</h3>
                  <p className={styles.similarProductPrice}>
                    {formatPrice(product.price, product.currency)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Sticky Add to Cart Bar */}
      <div className={styles.stickyAddToCartBar}>
        <div className={styles.quantitySelector}>
          <button 
            className={styles.quantityButton}
            onClick={() => setQty(prev => Math.max(1, prev - 1))}
            disabled={qty <= 1}
          >
            <Minus size={16} />
          </button>
          <span className={styles.quantityValue}>{qty}</span>
          <button 
            className={styles.quantityButton}
            onClick={() => setQty(prev => Math.min(product.stockQuantity, prev + 1))}
            disabled={qty >= product.stockQuantity}
          >
            <Plus size={16} />
          </button>
        </div>
        
        <button 
          className={styles.wishlistToggleButton}
          onClick={handleWishlistToggle}
        >
          <Heart 
            size={24} 
            fill={isInWishlist ? "#e53e3e" : "none"} 
            color={isInWishlist ? "#e53e3e" : "#1a202c"} 
          />
        </button>
        
        <button 
          className={styles.addToCartButton}
          onClick={handleAddToCart}
          disabled={product.stockQuantity <= 0 || added}
        >
          {added ? (
            "Added!"
          ) : product.stockQuantity <= 0 ? (
            "Out of Stock"
          ) : (
            <>
              <ShoppingBag size={18} />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
      
      {/* Error Toast */}
      {error && (
        <div className={styles.errorToast}>
          {error}
        </div>
      )}
    </div>
  )
} 