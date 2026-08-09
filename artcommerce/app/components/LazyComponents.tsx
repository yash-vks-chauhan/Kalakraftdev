import React from 'react';
import { BundleOptimizer, FallbackComponents } from './BundleOptimizer';

// Simple fallback components using React.createElement
const createSimpleFallback = (className: string, text: string) => 
  React.createElement('div', { className }, text);

const createLoadingFallback = (className: string, loadingText: string) =>
  React.createElement('div', { 
    className: `${className} animate-pulse flex items-center justify-center` 
  }, React.createElement('div', { 
    className: 'text-gray-400' 
  }, loadingText));

// Lazy-loaded components with optimal bundle splitting - Only existing components
export const LazyProductCard = BundleOptimizer.createLazy({
  loader: () => import('./ProductCard'),
  fallback: FallbackComponents.ProductCard,
  chunkName: 'product-card',
  preload: true,
});

export const LazyVirtualProductGrid = BundleOptimizer.createLazy({
  loader: () => import('./VirtualProductGrid'),
  fallback: FallbackComponents.ProductGrid,
  chunkName: 'virtual-product-grid',
  preload: false,
});

export const LazyOptimizedSearch = BundleOptimizer.createLazy({
  loader: () => import('./OptimizedSearch'),
  fallback: FallbackComponents.Search,
  chunkName: 'optimized-search',
  preload: true,
});

// Dashboard components (admin only)
export const LazyAdminNotifications = BundleOptimizer.createLazy({
  loader: () => import('./AdminNotifications'),
  fallback: FallbackComponents.MinimalSpinner,
  chunkName: 'admin-notifications',
  preload: false,
});

// Product components
export const LazyProductImages = BundleOptimizer.createLazy({
  loader: () => import('./ProductImages'),
  fallback: createLoadingFallback('bg-gray-200 h-96 rounded-lg', 'Loading images...'),
  chunkName: 'product-images',
  preload: false,
});

export const LazyProductImagesMobile = BundleOptimizer.createLazy({
  loader: () => import('./ProductImagesMobile'),
  fallback: createLoadingFallback('bg-gray-200 h-64 rounded-lg', 'Loading mobile images...'),
  chunkName: 'product-images-mobile',
  preload: false,
});

// Cart and wishlist
export const LazyWishlistModal = BundleOptimizer.createLazy({
  loader: () => import('./WishlistModal'),
  fallback: FallbackComponents.MinimalSpinner,
  chunkName: 'wishlist-modal',
  preload: false,
});

// Checkout page
export const LazyCheckoutPage = BundleOptimizer.createLazy({
  loader: () => import('../checkout/page'),
  fallback: createLoadingFallback('max-w-2xl mx-auto p-8 bg-white rounded-lg', 'Loading checkout...'),
  chunkName: 'checkout-page',
  preload: false,
});

// 3D/Animation components (existing)
export const LazyHeroCanvas = BundleOptimizer.createLazy({
  loader: () => import('./HeroCanvas').then(module => ({ default: module.HeroCanvas })),
  fallback: createLoadingFallback('h-screen bg-gradient-to-br from-purple-900 to-blue-900', 'Loading 3D experience...'),
  chunkName: 'hero-canvas',
  preload: false,
});

// Video components
export const LazyMobileVideoSection = BundleOptimizer.createLazy({
  loader: () => import('./MobileVideoSection'),
  fallback: createLoadingFallback('h-48 bg-gray-200 rounded-lg', 'Loading video...'),
  chunkName: 'mobile-video',
  preload: false,
});

// File upload (admin/user)
export const LazyFileUpload = BundleOptimizer.createLazy({
  loader: () => import('./FileUpload'),
  fallback: createLoadingFallback('border-2 border-dashed border-gray-300 rounded-lg p-8 text-center', 'Loading uploader...'),
  chunkName: 'file-upload',
  preload: false,
});

// Auth modal
export const LazyAuthModal = BundleOptimizer.createLazy({
  loader: () => import('./AuthModal'),
  fallback: createLoadingFallback('fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50', 'Loading auth...'),
  chunkName: 'auth-modal',
  preload: false,
});

// Mobile components
export const LazyMobileMenuPanel = BundleOptimizer.createLazy({
  loader: () => import('./MobileMenuPanel'),
  fallback: FallbackComponents.MinimalSpinner,
  chunkName: 'mobile-menu',
  preload: false,
});

/*
 * LazyMobileSearchModal used to sit here. Its component was never imported by
 * anything — this registry entry was its only reference — and the storefront
 * search now lives in components/search/ProductSearch.
 */

export const LazyMobileFilterSortBar = BundleOptimizer.createLazy({
  loader: () => import('./MobileFilterSortBar'),
  fallback: createLoadingFallback('bg-white border-b p-4', 'Loading filters...'),
  chunkName: 'mobile-filter-sort',
  preload: false,
});

// Bundle optimization initialization
export const initializeBundleOptimization = () => {
  // Critical chunks to preload immediately
  const criticalChunks = [
    { 
      name: 'product-card', 
      loader: () => import('./ProductCard') 
    },
    { 
      name: 'optimized-search', 
      loader: () => import('./OptimizedSearch') 
    },
    {
      name: 'virtual-product-grid',
      loader: () => import('./VirtualProductGrid')
    },
  ];

  // Non-critical chunks to preload on idle
  const idleChunks = [
    { 
      name: 'wishlist-modal', 
      loader: () => import('./WishlistModal') 
    },
    { 
      name: 'auth-modal', 
      loader: () => import('./AuthModal') 
    },
    {
      name: 'mobile-menu',
      loader: () => import('./MobileMenuPanel')
    },
  ];

  // Preload critical chunks immediately
  BundleOptimizer.preloadCritical(criticalChunks);

  // Preload idle chunks when browser is idle
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        BundleOptimizer.preloadCritical(idleChunks);
      }, { timeout: 5000 });
    } else {
      setTimeout(() => {
        BundleOptimizer.preloadCritical(idleChunks);
      }, 2000);
    }
  }
};

// Bundle performance analysis (development only)
export const analyzeBundlePerformance = () => {
  if (process.env.NODE_ENV !== 'development') return;

  const summary = BundleOptimizer.getPerformanceSummary();
  const metrics = BundleOptimizer.getMetrics();

  console.group('📦 Bundle Performance Analysis');
  console.table(summary);
  
  if (metrics.length > 0) {
    console.group('📊 Chunk Load Times');
    console.table(
      metrics.map(m => ({
        chunk: m.chunkName,
        time: `${m.loadTime.toFixed(2)}ms`,
        status: m.error ? '❌ Failed' : '✅ Success',
      }))
    );
    console.groupEnd();
  }
  
  // Performance recommendations
  const slowChunks = metrics.filter(m => !m.error && m.loadTime > 100);
  if (slowChunks.length > 0) {
    console.warn('⚠️ Slow loading chunks (>100ms):', slowChunks.map(c => c.chunkName));
    console.log('💡 Consider splitting these chunks further or optimizing their imports');
  }
  
  const failedChunks = metrics.filter(m => m.error);
  if (failedChunks.length > 0) {
    console.error('❌ Failed chunks:', failedChunks.map(c => c.chunkName));
    console.log('🔧 Check import paths and component exports');
  }

  if (summary.averageLoadTime < 50) {
    console.log('🚀 Excellent bundle performance! Average load time under 50ms');
  } else if (summary.averageLoadTime < 100) {
    console.log('✅ Good bundle performance. Average load time under 100ms');
  } else {
    console.log('⚡ Consider optimizing bundle splitting for better performance');
  }
  
  console.groupEnd();
};

// Chunk preloader utility for specific routes
export const preloadRouteChunks = (route: string) => {
  const routeChunkMap: Record<string, Array<() => Promise<any>>> = {
    '/products': [
      () => import('./VirtualProductGrid'),
      () => import('./ProductCard'),
      () => import('./OptimizedSearch'),
      () => import('./ProductImages'),
    ],
    '/admin': [
      () => import('./AdminNotifications'),
      () => import('./FileUpload'),
    ],
    '/checkout': [
      () => import('../checkout/page'),
    ],
    '/': [
      () => import('./HeroCanvas').then(module => ({ default: module.HeroCanvas })),
      () => import('./MobileVideoSection'),
    ],
  };

  const chunks = routeChunkMap[route];
  if (chunks && typeof window !== 'undefined') {
    chunks.forEach((loader, index) => {
      // Stagger preloads to avoid blocking
      setTimeout(() => {
        BundleOptimizer.preloadCritical([{ 
          name: `route-${route}-chunk-${index}`, 
          loader 
        }]);
      }, index * 100);
    });
  }
};

// Export bundled components collection
export const LazyComponents = {
  // Product components
  ProductCard: LazyProductCard,
  VirtualProductGrid: LazyVirtualProductGrid,
  ProductImages: LazyProductImages,
  ProductImagesMobile: LazyProductImagesMobile,
  
  // Search
  OptimizedSearch: LazyOptimizedSearch,
  
  // Admin
  AdminNotifications: LazyAdminNotifications,
  
  // Cart & Checkout
  WishlistModal: LazyWishlistModal,
  CheckoutPage: LazyCheckoutPage,
  
  // 3D & Animation
  HeroCanvas: LazyHeroCanvas,
  
  // Media
  MobileVideoSection: LazyMobileVideoSection,
  FileUpload: LazyFileUpload,
  
  // Auth
  AuthModal: LazyAuthModal,
  
  // Mobile
  MobileMenuPanel: LazyMobileMenuPanel,
  MobileFilterSortBar: LazyMobileFilterSortBar,
};

export default LazyComponents;
