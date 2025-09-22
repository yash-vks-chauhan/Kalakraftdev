'use client';

import React from 'react';
import { initializeBundleOptimization, analyzeBundlePerformance } from './LazyComponents';
import { BundlePerformanceMonitor } from './BundleOptimizer';

interface PerformanceOptimizerProps {
  enableMonitoring?: boolean;
  enableAnalysis?: boolean;
}

const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  enableMonitoring = process.env.NODE_ENV === 'development',
  enableAnalysis = process.env.NODE_ENV === 'development'
}) => {
  React.useEffect(() => {
    // Initialize bundle optimization on mount
    initializeBundleOptimization();

    // Run performance analysis in development
    if (enableAnalysis) {
      // Delay analysis to allow initial chunks to load
      setTimeout(() => {
        analyzeBundlePerformance();
      }, 3000);
    }

    // Performance monitoring setup
    if (typeof window !== 'undefined' && enableMonitoring) {
      // Monitor Core Web Vitals
      const vitalsScript = document.createElement('script');
      vitalsScript.defer = true;
      vitalsScript.innerHTML = `
        (function() {
          // Web Vitals monitoring
          function logVital(metric) {
            console.log('[Performance]', metric.name, metric.value);
          }
          
          // Monitor LCP, FID, CLS
          const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              if (entry.entryType === 'largest-contentful-paint') {
                logVital({ name: 'LCP', value: entry.startTime });
              } else if (entry.entryType === 'first-input') {
                logVital({ name: 'FID', value: entry.processingStart - entry.startTime });
              } else if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                logVital({ name: 'CLS', value: entry.value });
              }
            });
          });
          
          try {
            observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
          } catch (e) {
            console.warn('[Performance] Web Vitals monitoring not supported');
          }
        })();
      `;
      document.head.appendChild(vitalsScript);
    }

    // Cleanup
    return () => {
      // Remove any global listeners or cleanup if needed
    };
  }, [enableAnalysis, enableMonitoring]);

  return (
    <>
      {/* Bundle performance monitor in development */}
      {enableMonitoring && (
        <BundlePerformanceMonitor enabled={enableMonitoring} />
      )}
      
      {/* Performance hints overlay in development */}
      {enableMonitoring && (
        <div
          id="performance-hints"
          style={{
            position: 'fixed',
            bottom: 10,
            left: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontFamily: 'monospace',
            zIndex: 9999,
            maxWidth: '200px',
            display: 'none', // Hidden by default, shown via console commands
          }}
        >
          <div>Performance Optimizer Active</div>
          <div>Press Ctrl+Shift+P for analysis</div>
        </div>
      )}
    </>
  );
};

export default PerformanceOptimizer;
