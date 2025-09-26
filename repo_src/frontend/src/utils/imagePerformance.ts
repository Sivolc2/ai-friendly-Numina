// Comprehensive image performance optimization utilities

import { preloadCriticalImages } from './imageOptimization';
import { optimizeImageUrl } from './imageUtils';

// Performance monitoring for images
export interface ImageLoadMetrics {
  url: string;
  loadTime: number;
  size: number;
  format: string;
  fromCache: boolean;
  timestamp: number;
}

class ImagePerformanceMonitor {
  private metrics: ImageLoadMetrics[] = [];
  private loadingImages = new Set<string>();

  trackImageLoad(url: string, startTime: number, size?: number) {
    const loadTime = performance.now() - startTime;
    const metric: ImageLoadMetrics = {
      url: url.substring(0, 100), // Truncate for privacy
      loadTime,
      size: size || 0,
      format: this.getImageFormat(url),
      fromCache: loadTime < 50, // Likely from cache if very fast
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    this.loadingImages.delete(url);

    // Keep only last 50 metrics to avoid memory bloat
    if (this.metrics.length > 50) {
      this.metrics = this.metrics.slice(-50);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Image Performance: ${loadTime.toFixed(1)}ms - ${metric.format} - ${metric.fromCache ? 'CACHED' : 'NETWORK'}`);
    }
  }

  startTracking(url: string) {
    this.loadingImages.add(url);
    return performance.now();
  }

  getAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.loadTime, 0) / this.metrics.length;
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    const cacheHits = this.metrics.filter(m => m.fromCache).length;
    return (cacheHits / this.metrics.length) * 100;
  }

  getMetrics() {
    return {
      totalImages: this.metrics.length,
      averageLoadTime: this.getAverageLoadTime(),
      cacheHitRate: this.getCacheHitRate(),
      currentlyLoading: this.loadingImages.size,
      recentMetrics: this.metrics.slice(-10)
    };
  }

  private getImageFormat(url: string): string {
    if (url.includes('format=webp') || url.includes('.webp')) return 'WebP';
    if (url.includes('format=avif') || url.includes('.avif')) return 'AVIF';
    if (url.includes('.png')) return 'PNG';
    return 'JPEG';
  }
}

// Global performance monitor instance
export const imagePerformanceMonitor = new ImagePerformanceMonitor();

// Intelligent image preloading based on user behavior
export class SmartImagePreloader {
  private preloadQueue: string[] = [];
  private preloaded = new Set<string>();
  private maxConcurrent = 3;
  private currentlyPreloading = 0;

  async preloadImagesIntelligently(
    images: { url: string; priority: number }[],
    options: {
      immediate?: number; // Number to preload immediately
      maxConcurrent?: number;
      delayBetweenBatches?: number;
    } = {}
  ) {
    const { immediate = 3, maxConcurrent = 3, delayBetweenBatches = 100 } = options;
    this.maxConcurrent = maxConcurrent;

    // Sort by priority (higher = more important)
    const sortedImages = images
      .filter(img => !this.preloaded.has(img.url))
      .sort((a, b) => b.priority - a.priority);

    if (sortedImages.length === 0) return;

    console.log(`🚀 Smart preloading ${sortedImages.length} images...`);

    // Preload immediate images first (critical)
    const immediateImages = sortedImages.slice(0, immediate);
    const remainingImages = sortedImages.slice(immediate);

    // Load critical images immediately
    if (immediateImages.length > 0) {
      await preloadCriticalImages(
        immediateImages.map(img => img.url),
        this.maxConcurrent
      );
      immediateImages.forEach(img => this.preloaded.add(img.url));
    }

    // Load remaining images progressively
    if (remainingImages.length > 0) {
      setTimeout(() => {
        this.preloadProgressively(remainingImages.map(img => img.url), delayBetweenBatches);
      }, 1000); // Wait 1 second before starting progressive loading
    }
  }

  private async preloadProgressively(urls: string[], delay: number) {
    for (const url of urls) {
      if (this.preloaded.has(url) || this.currentlyPreloading >= this.maxConcurrent) {
        continue;
      }

      this.currentlyPreloading++;
      
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = url;
        });
        
        this.preloaded.add(url);
        console.log(`✓ Preloaded: ${url.substring(0, 50)}...`);
      } catch (error) {
        console.warn(`Failed to preload: ${url.substring(0, 50)}...`);
      } finally {
        this.currentlyPreloading--;
      }

      // Small delay between preloads to avoid overwhelming the browser
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  isPreloaded(url: string): boolean {
    return this.preloaded.has(url);
  }

  getStats() {
    return {
      preloaded: this.preloaded.size,
      currentlyPreloading: this.currentlyPreloading
    };
  }
}

// Global smart preloader instance
export const smartImagePreloader = new SmartImagePreloader();

// Image optimization recommendations based on current performance
export const getOptimizationRecommendations = (): string[] => {
  const metrics = imagePerformanceMonitor.getMetrics();
  const recommendations: string[] = [];

  if (metrics.averageLoadTime > 1000) {
    recommendations.push('Consider reducing image quality or size');
  }

  if (metrics.cacheHitRate < 50) {
    recommendations.push('Increase cache duration or preload more images');
  }

  if (metrics.currentlyLoading > 5) {
    recommendations.push('Too many concurrent image loads - implement queuing');
  }

  if (recommendations.length === 0) {
    recommendations.push('Image performance is optimal! 🚀');
  }

  return recommendations;
};

// Auto-optimize images based on viewport and connection
export const getViewportOptimizedImageUrl = (
  baseUrl: string,
  containerWidth: number,
  containerHeight?: number
): string => {
  // Get device pixel ratio for high-DPI displays
  const dpr = window.devicePixelRatio || 1;
  
  // Calculate optimal width considering DPR but cap it to avoid oversized images
  const optimalWidth = Math.min(containerWidth * dpr, 1920);
  
  // Use network-aware optimization
  return optimizeImageUrl(baseUrl, {
    width: optimalWidth,
    height: containerHeight ? Math.min(containerHeight * dpr, 1080) : undefined,
    networkAware: true,
    format: 'webp' // Prefer WebP for best compression
  });
};

// Memory-efficient image cache for blur placeholders
class BlurPlaceholderCache {
  private cache = new Map<string, string>();
  private maxSize = 100; // Maximum cached placeholders

  set(url: string, blurDataUrl: string) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(url, blurDataUrl);
  }

  get(url: string): string | undefined {
    return this.cache.get(url);
  }

  has(url: string): boolean {
    return this.cache.has(url);
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

export const blurPlaceholderCache = new BlurPlaceholderCache();