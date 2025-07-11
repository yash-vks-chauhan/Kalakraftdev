'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductImagesMobile from '../../components/ProductImagesMobile';
import { useCart } from '../../contexts/CartContext';
import WishlistButton from '../../components/WishlistButton';
import styles from './mobile_product_details.module.css';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  price: number;
  currency: string;
  imageUrls: string[];
  stockQuantity: number;
  category: { id: number; name: string; slug: string } | null;
  specifications?: string | null;
  careInstructions?: string | null;
  stylingIdeaImages?: ({ url: string; text?: string } | string)[] | null;
}

interface MobileProductDetailsProps {
  product: Product;
  avgRating: number;
  ratingCount: number;
}

export default function MobileProductDetails({ 
  product, 
  avgRating, 
  ratingCount 
}: MobileProductDetailsProps) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  
  // Section expansion states
  const [expandedSections, setExpandedSections] = useState({
    description: false,
    specifications: false,
    care: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await addToCart(product.id, qty);
      setAdded(true);
      
      // Reset the added state after 3 seconds
      setTimeout(() => {
        setAdded(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error adding to cart');
    }
  };

  const getStockStatus = () => {
    if (product.stockQuantity <= 0) return 'Out of stock';
    if (product.stockQuantity < 10) return `Low stock: ${product.stockQuantity} left`;
    return `In stock: ${product.stockQuantity} available`;
  };

  // Format specifications text
  const formatSpecifications = (text: string) => {
    if (!text) return [];
    
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      
      // Check if it's a key-value pair (contains : or -)
      if (trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        return (
          <div key={index} className={styles.specRow}>
            <span className={styles.specKey}>{key.trim()}</span>
            <span className={styles.specValue}>{value}</span>
          </div>
        );
      } else if (trimmed.startsWith('-')) {
        return (
          <div key={index} className={styles.specBullet}>
            {trimmed.substring(1).trim()}
          </div>
        );
      } else {
        return (
          <div key={index} className={styles.specText}>
            {trimmed}
          </div>
        );
      }
    }).filter(Boolean);
  };

  return (
    <div className={styles.mobileProductContainer}>
      {/* Product Images - Full width with transparent background */}
      <div className="product-image-wrapper">
        <ProductImagesMobile 
          imageUrls={product.imageUrls} 
          name={product.name} 
        />
      </div>
      
      {/* Product Info - Overlapping the image slightly with rounded corners */}
      <div className={styles.productInfo}>
        {/* Category */}
        {product.category && (
          <Link href={`/products?category=${product.category.slug}`} className={styles.category}>
            {product.category.name}
          </Link>
        )}
        
        {/* Product Name */}
        <h1 className={styles.productName}>{product.name}</h1>
        
        {/* Variation (if applicable) - Moved up like in Gucci design */}
        <div className={styles.variation}>
          <span className={styles.variationLabel}>Variation</span>
          <span className={styles.variationValue}>{product.shortDesc || 'Standard'}</span>
        </div>
        
        {/* Price */}
        <div className={styles.priceContainer}>
          <p className={styles.price}>
            <span className={styles.currency}>{product.currency}</span>
            {product.price.toFixed(2)}
          </p>
          
          {/* Rating */}
          {ratingCount > 0 && (
            <div className={styles.ratingContainer}>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <span 
                    key={i} 
                    className={i < Math.round(avgRating) ? styles.filledStar : styles.emptyStar}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className={styles.ratingCount}>({ratingCount})</span>
            </div>
          )}
        </div>
        
        {/* Stock Status */}
        <div className={styles.stockStatus}>
          <span className={product.stockQuantity <= 0 ? styles.outOfStock : 
                          product.stockQuantity < 10 ? styles.lowStock : 
                          styles.inStock}>
            {getStockStatus()}
          </span>
        </div>
        
        {/* Add to Cart Form */}
        <form onSubmit={handleAddToCart} className={styles.addToCartForm}>
          <div className={styles.quantityContainer}>
            <label htmlFor="quantity" className={styles.quantityLabel}>Quantity</label>
            <div className={styles.quantityControls}>
              <button 
                type="button" 
                className={styles.quantityButton}
                onClick={() => qty > 1 && setQty(qty - 1)}
                disabled={qty <= 1}
              >
                -
              </button>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                max={product.stockQuantity}
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className={styles.quantityInput}
              />
              <button 
                type="button" 
                className={styles.quantityButton}
                onClick={() => qty < product.stockQuantity && setQty(qty + 1)}
                disabled={qty >= product.stockQuantity}
              >
                +
              </button>
            </div>
          </div>
          
          <div className={styles.actionButtons}>
            <button 
              type="submit" 
              className={styles.addToCartButton}
              disabled={product.stockQuantity <= 0 || added}
            >
              {added ? 'Added to Cart ✓' : 'Add to Cart'}
            </button>
            
            <div className={styles.wishlistContainer}>
              <WishlistButton productId={product.id} />
            </div>
          </div>
          
          {error && <p className={styles.error}>{error}</p>}
        </form>
        
        {/* Collapsible Sections */}
        <div className={styles.accordionSections}>
          {/* Description Section */}
          <div className={styles.accordionSection}>
            <button 
              className={styles.accordionHeader} 
              onClick={() => toggleSection('description')}
              aria-expanded={expandedSections.description}
            >
              <span className={styles.accordionTitle}>Description</span>
              <span className={styles.accordionIcon}>
                {expandedSections.description ? '−' : '+'}
              </span>
            </button>
            
            {expandedSections.description && (
              <div className={styles.accordionContent}>
                <p className={styles.description}>{product.description}</p>
              </div>
            )}
          </div>
          
          {/* Specifications Section */}
          {product.specifications && (
            <div className={styles.accordionSection}>
              <button 
                className={styles.accordionHeader} 
                onClick={() => toggleSection('specifications')}
                aria-expanded={expandedSections.specifications}
              >
                <span className={styles.accordionTitle}>Specifications</span>
                <span className={styles.accordionIcon}>
                  {expandedSections.specifications ? '−' : '+'}
                </span>
              </button>
              
              {expandedSections.specifications && (
                <div className={styles.accordionContent}>
                  <div className={styles.specificationsList}>
                    {formatSpecifications(product.specifications)}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Care Instructions Section */}
          {product.careInstructions && (
            <div className={styles.accordionSection}>
              <button 
                className={styles.accordionHeader} 
                onClick={() => toggleSection('care')}
                aria-expanded={expandedSections.care}
              >
                <span className={styles.accordionTitle}>Care Instructions</span>
                <span className={styles.accordionIcon}>
                  {expandedSections.care ? '−' : '+'}
                </span>
              </button>
              
              {expandedSections.care && (
                <div className={styles.accordionContent}>
                  <p className={styles.careInstructions}>{product.careInstructions}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 