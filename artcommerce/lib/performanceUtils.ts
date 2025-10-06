// Performance monitoring and optimization utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private isLowEndDevice = false;
  private isReducedMotion = false;

  constructor() {
    this.detectDeviceCapabilities();
    this.detectMotionPreferences();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private detectDeviceCapabilities() {
    if (typeof window === 'undefined') return;

    // Detect low-end devices
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const deviceMemory = (navigator as any).deviceMemory || 1;
    const connection = (navigator as any).connection;

    this.isLowEndDevice = 
      hardwareConcurrency <= 2 || 
      deviceMemory <= 2 || 
      (connection && connection.saveData) ||
      /Android.*(4\.[0-3]|5\.[01])|iPhone.*OS [1-9]_/.test(navigator.userAgent);
  }

  private detectMotionPreferences() {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.isReducedMotion = mediaQuery.matches;
    
    mediaQuery.addEventListener('change', (e) => {
      this.isReducedMotion = e.matches;
    });
  }

  // Track animation performance
  public trackAnimation(name: string, startTime: number, endTime: number) {
    const duration = endTime - startTime;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const measurements = this.metrics.get(name)!;
    measurements.push(duration);
    
    // Keep only last 10 measurements
    if (measurements.length > 10) {
      measurements.shift();
    }
  }

  // Get average animation time
  public getAverageTime(name: string): number {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) return 0;
    
    return measurements.reduce((a, b) => a + b, 0) / measurements.length;
  }

  // Get performance recommendations
  public getOptimizationConfig() {
    return {
      shouldReduceParticles: this.isLowEndDevice,
      shouldUseReducedMotion: this.isReducedMotion,
      particleCount: this.isLowEndDevice ? 20 : 40,
      animationDuration: this.isLowEndDevice ? 400 : 600,
      shouldUseGPU: !this.isLowEndDevice,
      shouldPreloadImages: !this.isLowEndDevice,
      maxConcurrentAnimations: this.isLowEndDevice ? 1 : 3
    };
  }

  // Check if performance is acceptable
  public isPerformanceGood(animationName: string): boolean {
    const avgTime = this.getAverageTime(animationName);
    return avgTime < 16.67; // 60fps threshold
  }

  // Get device classification
  public getDeviceClass(): 'low' | 'mid' | 'high' {
    if (this.isLowEndDevice) return 'low';
    
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const deviceMemory = (navigator as any).deviceMemory || 4;
    
    if (hardwareConcurrency >= 8 && deviceMemory >= 8) return 'high';
    return 'mid';
  }

  // Adaptive quality settings
  public getQualitySettings() {
    const deviceClass = this.getDeviceClass();
    
    switch (deviceClass) {
      case 'low':
        return {
          particleCount: 15,
          animationDuration: 300,
          useBlur: false,
          useShadows: false,
          useGradients: false
        };
      case 'mid':
        return {
          particleCount: 30,
          animationDuration: 500,
          useBlur: true,
          useShadows: false,
          useGradients: true
        };
      case 'high':
        return {
          particleCount: 50,
          animationDuration: 700,
          useBlur: true,
          useShadows: true,
          useGradients: true
        };
    }
  }
}

// React hook for performance monitoring
export function usePerformanceOptimization() {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    config: monitor.getOptimizationConfig(),
    quality: monitor.getQualitySettings(),
    trackAnimation: monitor.trackAnimation.bind(monitor),
    isPerformanceGood: monitor.isPerformanceGood.bind(monitor),
    deviceClass: monitor.getDeviceClass()
  };
}

// Debounced animation trigger to prevent rapid firing
export function createAnimationDebouncer(delay: number = 300) {
  let timeoutId: NodeJS.Timeout;
  let isRunning = false;

  return function debounce(callback: () => void) {
    if (isRunning) return;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      isRunning = true;
      callback();
      
      // Reset after animation likely completes
      setTimeout(() => {
        isRunning = false;
      }, 1000);
    }, delay);
  };
}

// Intersection Observer for lazy loading animations
export function createAnimationObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  if (typeof window === 'undefined') return null;

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
}

// CSS-in-JS optimizations for hardware acceleration
export const hardwareAcceleratedStyles = {
  transform: 'translate3d(0, 0, 0)',
  backfaceVisibility: 'hidden' as const,
  perspective: 1000,
  willChange: 'transform, opacity'
};

// Memory-efficient particle pooling
export class ParticlePool {
  private pool: any[] = [];
  private active: any[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(): any {
    if (this.pool.length > 0) {
      const particle = this.pool.pop();
      this.active.push(particle);
      return particle;
    }

    if (this.active.length < this.maxSize) {
      const particle = this.createParticle();
      this.active.push(particle);
      return particle;
    }

    return null; // Pool exhausted
  }

  release(particle: any): void {
    const index = this.active.indexOf(particle);
    if (index > -1) {
      this.active.splice(index, 1);
      this.resetParticle(particle);
      this.pool.push(particle);
    }
  }

  private createParticle() {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 1,
      opacity: 1,
      life: 0,
      maxLife: 1000
    };
  }

  private resetParticle(particle: any) {
    particle.x = 0;
    particle.y = 0;
    particle.vx = 0;
    particle.vy = 0;
    particle.size = 1;
    particle.opacity = 1;
    particle.life = 0;
    particle.maxLife = 1000;
  }
}
