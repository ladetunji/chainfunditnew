"use client";

import { useEffect } from 'react';

// Performance monitoring component
export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production and when web-vitals is available
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        // Core Web Vitals
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);

        // Custom performance metrics
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
            }
          }
        });

        observer.observe({ entryTypes: ['navigation'] });

        // Memory usage monitoring (if available)
        if ('memory' in performance) {
          const memory = (performance as any).memory;
        }

        // Network information (if available)
        if ('connection' in navigator) {
          const connection = (navigator as any).connection;
        }

        return () => {
          observer.disconnect();
        };
      }).catch(() => {
        // web-vitals not available, skip monitoring
      });
    }
  }, []);

  return null; // This component doesn't render anything
}

// Performance utility functions
export const performanceUtils = {
  // Measure function execution time
  measureTime: function<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return result;
  },

  // Measure async function execution time
  measureTimeAsync: async function<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${name} took ${(end - start).toFixed(2)}ms`);
    return result;
  },

  // Check if page is visible
  isPageVisible: (): boolean => {
    return !document.hidden;
  },

  // Get current memory usage
  getMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576),
      };
    }
    return null;
  },

  // Debounce function
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

export default PerformanceMonitor;
