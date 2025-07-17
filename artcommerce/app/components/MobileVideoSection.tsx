import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from '../home.module.css';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrls: string[];
  stockQuantity: number;
  isNew?: boolean;
  category?: {
    name: string;
  };
}

interface MobileVideoSectionProps {
  featuredProducts?: Product[];
}

const MobileVideoSection: React.FC<MobileVideoSectionProps> = ({ featuredProducts = [] }) => {
  // Demo products if none are provided
  const defaultProducts: Product[] = [
    {
      id: '1',
      name: 'Handcrafted Resin Clock',
      price: 4999,
      imageUrls: ['/images/featured1.png', '/images/category1.png'],
      stockQuantity: 5,
      isNew: true,
      category: { name: 'Clocks' }
    },
    {
      id: '2',
      name: 'Decorative Wall Piece',
      price: 3499,
      imageUrls: ['/images/featured2.png', '/images/category2.png'],
      stockQuantity: 8,
      category: { name: 'Wall Decor' }
    },
    {
      id: '3',
      name: 'Resin Tray Set',
      price: 2999,
      imageUrls: ['/images/featured3.JPG', '/images/category3.png'],
      stockQuantity: 3,
      category: { name: 'Trays' }
    },
    {
      id: '4',
      name: 'Designer Flower Vase',
      price: 1999,
      imageUrls: ['/images/category4.png', '/images/category5.png'],
      stockQuantity: 0,
      category: { name: 'Decor' }
    }
  ];

  const products = featuredProducts.length > 0 ? featuredProducts : defaultProducts;
  
  // State for carousel
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Format price to INR
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Handle touch events for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
    e.preventDefault();
  };
  
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const diff = startX - currentX;
    const threshold = 50; // Minimum swipe distance
    
    if (diff > threshold) {
      // Swipe left - next card
      setCurrentIndex((prev) => (prev + 1) % products.length);
    } else if (diff < -threshold) {
      // Swipe right - previous card
      setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    }
    
    setIsDragging(false);
  };
  
  // Calculate transform for each card based on its position relative to current
  const getCardStyle = (index: number) => {
    // Calculate position relative to current (accounting for circular navigation)
    let position = index - currentIndex;
    if (position < 0) position += products.length;
    if (position >= products.length) position -= products.length;
    
    // If dragging, calculate the drag offset
    let dragOffset = 0;
    if (isDragging) {
      dragOffset = (currentX - startX) * 0.5; // Reduce movement for smoother effect
    }
    
    // Base styles
    const style: React.CSSProperties = {
      position: 'absolute',
      width: '85%',
      maxWidth: '350px',
      transition: isDragging ? 'none' : 'all 0.4s ease',
      borderRadius: '0px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      opacity: 1,
      zIndex: products.length - position,
      transformOrigin: 'center center'
    };
    
    // Position 0 is current (front) card
    if (position === 0) {
      style.transform = `translateX(${dragOffset}px) scale(1)`;
      style.zIndex = products.length + 1;
      style.opacity = 1;
    } 
    // Position 1 is next card (slightly behind and to the right)
    else if (position === 1) {
      style.transform = `translateX(${30 + dragOffset}px) scale(0.95) translateY(10px)`;
      style.opacity = 0.8;
    }
    // Position 2 is two cards back
    else if (position === 2) {
      style.transform = `translateX(${60 + dragOffset}px) scale(0.9) translateY(20px)`;
      style.opacity = 0.6;
    }
    // Position 3 is three cards back (barely visible)
    else if (position === 3) {
      style.transform = `translateX(${90 + dragOffset}px) scale(0.85) translateY(30px)`;
      style.opacity = 0.4;
    }
    // All other cards are stacked behind
    else {
      style.transform = `translateX(${120 + dragOffset}px) scale(0.8) translateY(40px)`;
      style.opacity = 0;
    }
    
    return style;
  };

  return (
    <section className={`${styles.mobileOnly}`} style={{ 
      padding: '2rem 0 3rem 0',
      background: '#111111', // Dark background for premium look
      position: 'relative',
      overflow: 'hidden',
      color: '#fff'
    }}>
      {/* Background design elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 
          `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"),
          url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.7,
        pointerEvents: 'none',
        zIndex: 1
      }} />
      
      {/* Decorative corner accent */}
      <div style={{
        position: 'absolute',
        top: '30px',
        left: '30px',
        width: '60px',
        height: '60px',
        borderTop: '1px solid',
        borderLeft: '1px solid',
        borderImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05)) 1',
        zIndex: 2,
        pointerEvents: 'none'
      }} />
      
      {/* Section header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem',
        position: 'relative',
        padding: '0 1rem',
        zIndex: 2
      }}>
        <div style={{ 
          width: '40px',
          height: '1px',
          background: 'rgba(255,255,255,0.3)',
          margin: '0.5rem auto'
        }} />
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '2rem',
          fontWeight: 400,
          color: '#fff',
          margin: 0,
          letterSpacing: '0.05em',
          fontStyle: 'italic'
        }}>Explore Our Collections</h2>
        <div style={{ 
          width: '40px',
          height: '1px',
          background: 'rgba(255,255,255,0.3)',
          margin: '0.5rem auto'
        }} />
      </div>
      
      {/* Description */}
      <div style={{
        textAlign: 'center',
        maxWidth: '90%',
        margin: '0 auto 2rem',
        fontSize: '0.95rem',
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.7)',
        padding: '0 1rem',
        position: 'relative',
        zIndex: 2
      }}>
        <p>Discover our handcrafted pieces, each telling a unique story</p>
      </div>
      
      {/* Stacked Card Carousel */}
      <div 
        ref={carouselRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '420px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '2rem',
          zIndex: 3
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {products.map((product, index) => (
          <div key={product.id} style={getCardStyle(index)}>
            <Link href={`/products/${product.id}`} style={{
              textDecoration: 'none',
              display: 'block',
              height: '100%',
              width: '100%',
              background: '#fff',
              color: '#000'
            }}>
              <div style={{
                width: '100%',
                aspectRatio: '1/1',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <img 
                  src={product.imageUrls[0]} 
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                
                {/* Product badges */}
                {product.isNew && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: '#000',
                    color: '#fff',
                    fontSize: '0.65rem',
                    padding: '4px 8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 500
                  }}>
                    New
                  </div>
                )}
                
                {product.stockQuantity === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    color: '#000',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                    backdropFilter: 'blur(2px)'
                  }}>
                    Out of Stock
                  </div>
                )}
                
                {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    fontSize: '0.65rem',
                    padding: '4px 8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 500,
                    backdropFilter: 'blur(2px)'
                  }}>
                    Only {product.stockQuantity} left
                  </div>
                )}
              </div>
              
              <div style={{
                padding: '12px 16px 16px',
                background: '#fff'
              }}>
                {product.category && (
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#666',
                    marginBottom: '4px',
                    fontWeight: 400
                  }}>
                    {product.category.name}
                  </div>
                )}
                
                <h3 style={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  margin: '0 0 8px 0',
                  lineHeight: 1.3,
                  color: '#000'
                }}>
                  {product.name}
                </h3>
                
                <div style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#000'
                }}>
                  {formatPrice(product.price)}
                </div>
              </div>
            </Link>
          </div>
        ))}
        
        {/* Swipe indicator */}
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '6px'
        }}>
          {products.map((_, index) => (
            <div 
              key={index} 
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: index === currentIndex ? '#fff' : 'rgba(255,255,255,0.3)',
                transition: 'background 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Footer section */}
      <div style={{
        textAlign: 'center',
        margin: '2.5rem auto 0',
        padding: '0 1rem',
        position: 'relative',
        zIndex: 2
      }}>
        <Link 
          href="/products" 
          style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            backgroundColor: 'transparent',
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: 400,
            letterSpacing: '0.05em',
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.3)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 1
          }}
        >
          View All Collections
        </Link>
      </div>
    </section>
  );
};

export default MobileVideoSection; 