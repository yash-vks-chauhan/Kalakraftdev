'use client'

import React from 'react'
import { useBestSellers } from './hooks/useBestSellers'
import BestSellersHeader from './BestSellersHeader'
import BestSellersDesktop from './BestSellersDesktop'
import BestSellersMobile from './BestSellersMobile'
import BestSellersLoading from './BestSellersLoading'
import BestSellersError from './BestSellersError'
import styles from './BestSellers.module.css'

interface BestSellersProps {
  styles?: any // Legacy support - can be removed when migrating
}

const BestSellersSection = ({ styles: legacyStyles }: BestSellersProps) => {
  const { products, loading, error, refetch } = useBestSellers()
  
  // Use modern styles if available, fallback to legacy
  const componentStyles = styles || legacyStyles

  if (loading) return <BestSellersLoading styles={componentStyles} />
  if (error) return <BestSellersError error={error} onRetry={refetch} styles={componentStyles} />
  if (!products.length) return null

  return (
    <section className={componentStyles.bestSellersSection} data-aos="fade-up">
      <BestSellersHeader styles={componentStyles} />
      <BestSellersDesktop products={products} styles={componentStyles} />  
      <BestSellersMobile products={products} styles={componentStyles} />
    </section>
  )
}

export default BestSellersSection
