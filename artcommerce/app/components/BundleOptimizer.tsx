'use client';

import React, { lazy, Suspense, ComponentType, ReactElement } from 'react';

// Bundle splitting configuration
interface LazyComponentConfig {
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallback: ReactElement;
  preload?: boolean;
  chunkName?: string;
}

// Performance metrics for bundle loading
interface BundleMetrics {
  chunkName: string;
  loadTime: number;
  size?: number;
  error?: string;
}

class BundleManager {
  private static instance: BundleManager;
  private loadedChunks = new Set<string>();
  private preloadedChunks = new Set<string>();
  private metrics: BundleMetrics[] = [];
  private pendingLoads = new Map<string, Promise<any>>();

  static getInstance(): BundleManager {
    if (!BundleManager.instance) {
      BundleManager.instance = new BundleManager();
    }
    return BundleManager.instance;
  }

  // Preload a chunk without rendering
  async preloadChunk(chunkName: string, loader: () => Promise<any>): Promise<void> {
    if (this.preloadedChunks.has(chunkName) || this.loadedChunks.has(chunkName)) {
      return;
    }

    // Avoid duplicate preloads
    if (this.pendingLoads.has(chunkName)) {
      return this.pendingLoads.get(chunkName);
    }

    const startTime = performance.now();
    const preloadPromise = loader()
      .then((module) => {
        const loadTime = performance.now() - startTime;
        this.preloadedChunks.add(chunkName);
        
        this.metrics.push({
          chunkName,
          loadTime,
        });

        if (process.env.NODE_ENV === 'development') {
          console.log(`[Bundle] Preloaded ${chunkName} in ${loadTime.toFixed(2)}ms`);
        }

        return module;
      })
      .catch((error) => {
        this.metrics.push({
          chunkName,
          loadTime: performance.now() - startTime,
          error: error.message,
        });

        console.error(`[Bundle] Failed to preload ${chunkName}:`, error);
        throw error;
      })
      .finally(() => {
        this.pendingLoads.delete(chunkName);
      });

    this.pendingLoads.set(chunkName, preloadPromise);
    return preloadPromise;
  }

  // Mark chunk as loaded
  markChunkLoaded(chunkName: string): void {
    this.loadedChunks.add(chunkName);
  }

  // Get loading metrics
  getMetrics(): BundleMetrics[] {
    return [...this.metrics];
  }

  // Get performance summary
  getPerformanceSummary() {
    const successful = this.metrics.filter(m => !m.error);
    const failed = this.metrics.filter(m => m.error);
    
    return {
      totalChunks: this.metrics.length,
      successfulLoads: successful.length,
      failedLoads: failed.length,
      averageLoadTime: successful.length > 0 
        ? successful.reduce((sum, m) => sum + m.loadTime, 0) / successful.length 
        : 0,
      preloadedChunks: this.preloadedChunks.size,
      loadedChunks: this.loadedChunks.size,
    };
  }
}

// Enhanced lazy component wrapper with metrics
function createOptimizedLazy<T = {}>(config: LazyComponentConfig) {
  const { loader, fallback, preload = false, chunkName = 'unknown' } = config;
  const bundleManager = BundleManager.getInstance();

  // Create lazy component with performance tracking
  const LazyComponent = lazy(async () => {
    const startTime = performance.now();
    
    try {
      const module = await loader();
      const loadTime = performance.now() - startTime;
      
      bundleManager.markChunkLoaded(chunkName);
      bundleManager.getMetrics().push({
        chunkName,
        loadTime,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Bundle] Loaded ${chunkName} in ${loadTime.toFixed(2)}ms`);
      }

      return module;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      bundleManager.getMetrics().push({
        chunkName,
        loadTime,
        error: (error as Error).message,
      });

      console.error(`[Bundle] Failed to load ${chunkName}:`, error);
      throw error;
    }
  });

  // Preload if requested
  if (preload && typeof window !== 'undefined') {
    bundleManager.preloadChunk(chunkName, loader);
  }

  // Return wrapped component
  return React.forwardRef<any, T>((props, ref) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
}

// Bundle splitting utilities for different component types
export const BundleOptimizer = {
  // Create optimized lazy component
  createLazy: createOptimizedLazy,

  // Preload critical chunks on page load
  preloadCritical: (chunks: Array<{ name: string; loader: () => Promise<any> }>) => {
    if (typeof window === 'undefined') return;

    const bundleManager = BundleManager.getInstance();
    
    // Use requestIdleCallback or setTimeout for non-blocking preloads
    const preloadChunks = () => {
      chunks.forEach(({ name, loader }) => {
        bundleManager.preloadChunk(name, loader);
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadChunks);
    } else {
      setTimeout(preloadChunks, 100);
    }
  },

  // Preload on user interaction
  preloadOnInteraction: (
    element: HTMLElement | null,
    chunkName: string,
    loader: () => Promise<any>
  ) => {
    if (!element || typeof window === 'undefined') return;

    const bundleManager = BundleManager.getInstance();
    let preloaded = false;

    const handleInteraction = () => {
      if (!preloaded) {
        preloaded = true;
        bundleManager.preloadChunk(chunkName, loader);
      }
    };

    // Multiple interaction events
    ['mouseenter', 'focus', 'touchstart'].forEach(event => {
      element.addEventListener(event, handleInteraction, { passive: true, once: true });
    });

    // Cleanup function
    return () => {
      ['mouseenter', 'focus', 'touchstart'].forEach(event => {
        element.removeEventListener(event, handleInteraction);
      });
    };
  },

  // Get performance metrics
  getMetrics: () => BundleManager.getInstance().getMetrics(),
  
  // Get performance summary
  getPerformanceSummary: () => BundleManager.getInstance().getPerformanceSummary(),
};

// Common fallback components for different contexts
export const FallbackComponents = {
  // Product-related fallbacks
  ProductCard: (
    <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
      <div className="bg-gray-200 h-48 rounded-md mb-4"></div>
      <div className="bg-gray-200 h-4 rounded mb-2"></div>
      <div className="bg-gray-200 h-4 rounded w-2/3 mb-2"></div>
      <div className="bg-gray-200 h-6 rounded w-1/3"></div>
    </div>
  ),

  ProductGrid: (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
          <div className="bg-gray-200 h-48 rounded-md mb-4"></div>
          <div className="bg-gray-200 h-4 rounded mb-2"></div>
          <div className="bg-gray-200 h-4 rounded w-2/3 mb-2"></div>
          <div className="bg-gray-200 h-6 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  ),

  ProductDetails: (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-200 h-96 rounded-lg"></div>
        <div className="space-y-4">
          <div className="bg-gray-200 h-8 rounded w-3/4"></div>
          <div className="bg-gray-200 h-6 rounded w-1/2"></div>
          <div className="bg-gray-200 h-20 rounded"></div>
          <div className="bg-gray-200 h-12 rounded w-1/3"></div>
        </div>
      </div>
    </div>
  ),

  // Search fallback
  Search: (
    <div className="max-w-md mx-auto animate-pulse">
      <div className="bg-gray-200 h-12 rounded-lg"></div>
    </div>
  ),

  // Cart fallback
  Cart: (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex items-center space-x-4 bg-white p-4 rounded-lg">
          <div className="bg-gray-200 h-16 w-16 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="bg-gray-200 h-4 rounded"></div>
            <div className="bg-gray-200 h-4 rounded w-2/3"></div>
          </div>
          <div className="bg-gray-200 h-8 w-20 rounded"></div>
        </div>
      ))}
    </div>
  ),

  // Generic loading states
  Spinner: (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),

  MinimalSpinner: (
    <div className="flex justify-center items-center py-4">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
    </div>
  ),
};

// Performance monitoring component (development only)
export const BundlePerformanceMonitor: React.FC<{ enabled?: boolean }> = ({ 
  enabled = process.env.NODE_ENV === 'development' 
}) => {
  const [metrics, setMetrics] = React.useState<BundleMetrics[]>([]);
  const [summary, setSummary] = React.useState<any>(null);

  React.useEffect(() => {
    if (!enabled) return;

    const updateMetrics = () => {
      const bundleManager = BundleManager.getInstance();
      setMetrics(bundleManager.getMetrics());
      setSummary(bundleManager.getPerformanceSummary());
    };

    // Update metrics periodically
    const interval = setInterval(updateMetrics, 2000);
    updateMetrics();

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled || !summary) return null;

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded text-xs font-mono z-50 max-w-sm">
      <div className="font-bold mb-2">Bundle Performance</div>
      <div>Total Chunks: {summary.totalChunks}</div>
      <div>Successful: {summary.successfulLoads}</div>
      <div>Failed: {summary.failedLoads}</div>
      <div>Avg Load Time: {summary.averageLoadTime.toFixed(2)}ms</div>
      <div>Preloaded: {summary.preloadedChunks}</div>
      <div>Loaded: {summary.loadedChunks}</div>
      
      {metrics.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer">Recent Loads</summary>
          <div className="mt-1 text-xs">
            {metrics.slice(-5).map((metric, i) => (
              <div key={i} className={`flex justify-between ${metric.error ? 'text-red-300' : 'text-green-300'}`}>
                <span>{metric.chunkName}</span>
                <span>{metric.error ? 'Error' : `${metric.loadTime.toFixed(0)}ms`}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default BundleOptimizer;
