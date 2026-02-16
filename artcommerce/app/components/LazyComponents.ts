import React from 'react';
import { BundleOptimizer, FallbackComponents } from './BundleOptimizer';

// Lazy-loaded product components with optimal bundle splitting
export const LazyProductCard = BundleOptimizer.createLazy({
  loader: () => import('./ProductCard'),
  fallback: FallbackComponents.ProductCard,
  chunkName: 'product-card',
  preload: true, // Critical component
});

export const LazyVirtualProductGrid = BundleOptimizer.createLazy({
  loader: () => import('./VirtualProductGrid'),
  fallback: FallbackComponents.ProductGrid,
  chunkName: 'virtual-product-grid',
  preload: false, // Load on demand
});

export const LazyOptimizedSearch = BundleOptimizer.createLazy({
  loader: () => import('./OptimizedSearch'),
  fallback: FallbackComponents.Search,
  chunkName: 'optimized-search',
  preload: true, // Critical for user interaction
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
  fallback: React.createElement('div', {
    className: 'bg-gray-200 h-96 rounded-lg animate-pulse flex items-center justify-center'
  }, React.createElement('div', {
    className: 'text-gray-400'
  }, 'Loading gallery...')),
  chunkName: 'product-gallery',
  preload: false,
});

export const LazyProductReviews = BundleOptimizer.createLazy({
  loader: () => import('./ProductReviews'),
  fallback: (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="bg-gray-100 p-4 rounded-lg">
          <div className="bg-gray-200 h-4 rounded w-1/4 mb-2"></div>
          <div className="bg-gray-200 h-16 rounded"></div>
        </div>
      ))}
    </div>
  ),
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
  fallback: (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="bg-gray-200 h-8 rounded w-1/3"></div>
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="bg-gray-200 h-12 rounded"></div>
        ))}
      </div>
    </div>
  ),
  chunkName: 'checkout-form',
  preload: false,
});

// 3D/Animation components (heavy)
export const LazyHeroCanvas = BundleOptimizer.createLazy({
  loader: () => import('./HeroCanvas'),
  fallback: (
    <div className="h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-pulse">Loading 3D experience...</div>
      </div>
    </div>
  ),
  chunkName: 'hero-canvas',
  preload: false,
});

export const LazyCosmosSectionWithFiber = BundleOptimizer.createLazy({
  loader: () => import('./CosmosSectionWithFiber'),
  fallback: (
    <div className="h-64 bg-gray-900 flex items-center justify-center">
      <div className="text-white animate-pulse">Loading cosmos...</div>
    </div>
  ),
  chunkName: 'cosmos-fiber',
  preload: false,
});

// Video components
export const LazyMobileVideoSection = BundleOptimizer.createLazy({
  loader: () => import('./MobileVideoSection'),
  fallback: (
    <div className="h-48 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400">Loading video...</div>
    </div>
  ),
  chunkName: 'mobile-video',
  preload: false,
});

// File upload (admin/user)
export const LazyFileUpload = BundleOptimizer.createLazy({
  loader: () => import('./FileUpload'),
  fallback: (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center animate-pulse">
      <div className="text-gray-400">Loading uploader...</div>
    </div>
  ),
  chunkName: 'file-upload',
  preload: false,
});

// Auth modal
export const LazyAuthModal = BundleOptimizer.createLazy({
  loader: () => import('./AuthModal'),
  fallback: (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg animate-pulse">
        <div className="bg-gray-200 h-6 rounded w-32 mb-4"></div>
        <div className="bg-gray-200 h-32 rounded"></div>
      </div>
    </div>
  ),
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
  fallback: (
    <div className="bg-white border-b p-4 animate-pulse">
      <div className="bg-gray-200 h-10 rounded"></div>
    </div>
  ),
  chunkName: 'mobile-filter-sort',
  preload: false,
});

// Preload critical chunks on app initialization
export const initializeBundleOptimization = () => {
  // Critical chunks to preload
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
  ];

  // Preload critical chunks immediately
  BundleOptimizer.preloadCritical(criticalChunks);

  // Preload idle chunks when browser is idle
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      BundleOptimizer.preloadCritical(idleChunks);
    });
  }
};

// Bundle size analysis (development only)
export const analyzeBundlePerformance = () => {
  if (process.env.NODE_ENV !== 'development') return;

  const summary = BundleOptimizer.getPerformanceSummary();
  const metrics = BundleOptimizer.getMetrics();

  console.group('📦 Bundle Performance Analysis');
  console.table(summary);
  
  if (metrics.length > 0) {
    console.group('Chunk Load Times');
    console.table(
      metrics.map(m => ({
        chunk: m.chunkName,
        time: `${m.loadTime.toFixed(2)}ms`,
        status: m.error ? 'Failed' : 'Success',
      }))
    );
    console.groupEnd();
  }
  
  // Performance recommendations
  const slowChunks = metrics.filter(m => m.loadTime > 100);
  if (slowChunks.length > 0) {
    console.warn('⚠️ Slow loading chunks (>100ms):', slowChunks.map(c => c.chunkName));
  }
  
  const failedChunks = metrics.filter(m => m.error);
  if (failedChunks.length > 0) {
    console.error('❌ Failed chunks:', failedChunks.map(c => c.chunkName));
  }
  
  console.groupEnd();
};

// Export all lazy components as default
export default {
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
  
  // Utilities
  initializeBundleOptimization,
  analyzeBundlePerformance,
};
