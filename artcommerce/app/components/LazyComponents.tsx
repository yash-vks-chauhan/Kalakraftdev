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

// Lazy-loaded product components with optimal bundle splitting
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
export const LazyAdminDashboard = BundleOptimizer.createLazy({
  loader: () => import('../dashboard/page'),
  fallback: FallbackComponents.Spinner,
  chunkName: 'admin-dashboard',
  preload: false,
});

export const LazyAdminNotifications = BundleOptimizer.createLazy({
  loader: () => import('./AdminNotifications'),
  fallback: FallbackComponents.MinimalSpinner,
  chunkName: 'admin-notifications',
  preload: false,
});

// Product detail components
export const LazyProductImageGallery = BundleOptimizer.createLazy({
  loader: () => import('./ProductImageGallery'),
  fallback: createLoadingFallback('bg-gray-200 h-96 rounded-lg', 'Loading gallery...'),
  chunkName: 'product-gallery',
  preload: false,
});

export const LazyProductReviews = BundleOptimizer.createLazy({
  loader: () => import('./ProductReviews'),
  fallback: createLoadingFallback('bg-gray-100 p-8 rounded-lg', 'Loading reviews...'),
  chunkName: 'product-reviews',
  preload: false,
});

// Cart and checkout
export const LazyMobileCartDrawer = BundleOptimizer.createLazy({
  loader: () => import('./MobileCartDrawer'),
  fallback: FallbackComponents.MinimalSpinner,
  chunkName: 'mobile-cart-drawer',
  preload: false,
});

export const LazyCheckoutForm = BundleOptimizer.createLazy({
  loader: () => import('../checkout/CheckoutForm'),
  fallback: createLoadingFallback('max-w-2xl mx-auto p-8 bg-white rounded-lg', 'Loading checkout...'),
  chunkName: 'checkout-form',
  preload: false,
});

// 3D/Animation components (heavy)
export const LazyHeroCanvas = BundleOptimizer.createLazy({
  loader: () => import('./HeroCanvas'),
  fallback: createLoadingFallback('h-screen bg-gradient-to-br from-purple-900 to-blue-900', 'Loading 3D experience...'),
  chunkName: 'hero-canvas',
  preload: false,
});

export const LazyCosmosSectionWithFiber = BundleOptimizer.createLazy({
  loader: () => import('./CosmosSectionWithFiber'),
  fallback: createLoadingFallback('h-64 bg-gray-900', 'Loading cosmos...'),
  chunkName: 'cosmos-fiber',
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

export const LazyMobileSearchModal = BundleOptimizer.createLazy({
  loader: () => import('./MobileSearchModal'),
  fallback: FallbackComponents.Search,
  chunkName: 'mobile-search',
  preload: false,
});

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
  ];

  // Non-critical chunks to preload on idle
  const idleChunks = [
    { 
      name: 'mobile-cart-drawer', 
      loader: () => import('./MobileCartDrawer') 
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
    ],
    '/admin': [
      () => import('../dashboard/page'),
      () => import('./AdminNotifications'),
      () => import('./FileUpload'),
    ],
    '/checkout': [
      () => import('../checkout/CheckoutForm'),
      () => import('./MobileCartDrawer'),
    ],
    '/': [
      () => import('./HeroCanvas'),
      () => import('./CosmosSectionWithFiber'),
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
  ProductImageGallery: LazyProductImageGallery,
  ProductReviews: LazyProductReviews,
  
  // Search
  OptimizedSearch: LazyOptimizedSearch,
  
  // Admin
  AdminDashboard: LazyAdminDashboard,
  AdminNotifications: LazyAdminNotifications,
  
  // Cart & Checkout
  MobileCartDrawer: LazyMobileCartDrawer,
  CheckoutForm: LazyCheckoutForm,
  
  // 3D & Animation
  HeroCanvas: LazyHeroCanvas,
  CosmosSectionWithFiber: LazyCosmosSectionWithFiber,
  
  // Media
  MobileVideoSection: LazyMobileVideoSection,
  FileUpload: LazyFileUpload,
  
  // Auth
  AuthModal: LazyAuthModal,
  
  // Mobile
  MobileMenuPanel: LazyMobileMenuPanel,
  MobileSearchModal: LazyMobileSearchModal,
  MobileFilterSortBar: LazyMobileFilterSortBar,
};

export default LazyComponents;
