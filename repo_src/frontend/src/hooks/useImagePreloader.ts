import { useState, useEffect, useCallback } from 'react';
import { smartImagePreloader, imagePerformanceMonitor } from '../utils/imagePerformance';
import { optimizeImageUrl } from '../utils/imageUtils';

interface UseImagePreloaderOptions {
  priority?: number; // Higher numbers = higher priority
  maxConcurrent?: number; // Maximum concurrent loads
}

interface PreloadItem {
  url: string;
  priority: number;
  loaded: boolean;
  loading: boolean;
  loadTime?: number;
}

export const useImagePreloader = (options: UseImagePreloaderOptions = {}) => {
  const { maxConcurrent = 3 } = options;
  const [queue, setQueue] = useState<PreloadItem[]>([]);
  const [loadingCount, setLoadingCount] = useState(0);

  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      // Use original URL without optimization for now
      img.src = url;
    });
  }, []);

  const addToQueue = useCallback((urls: string[], priority = 1) => {
    setQueue(currentQueue => {
      const newItems = urls
        .filter(url => !currentQueue.find(item => item.url === url))
        .map(url => ({
          url,
          priority,
          loaded: false,
          loading: false
        }));
      
      return [...currentQueue, ...newItems]
        .sort((a, b) => b.priority - a.priority);
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (loadingCount >= maxConcurrent) return;

    const nextItem = queue.find(item => !item.loaded && !item.loading);
    if (!nextItem) return;

    setQueue(currentQueue =>
      currentQueue.map(item =>
        item.url === nextItem.url ? { ...item, loading: true } : item
      )
    );

    setLoadingCount(count => count + 1);

    try {
      const startTime = performance.now();
      await preloadImage(nextItem.url);
      const loadTime = performance.now() - startTime;
      
      setQueue(currentQueue =>
        currentQueue.map(item =>
          item.url === nextItem.url
            ? { ...item, loaded: true, loading: false, loadTime }
            : item
        )
      );
    } catch (error) {
      console.warn(`Failed to preload image: ${nextItem.url}`, error);
      setQueue(currentQueue =>
        currentQueue.filter(item => item.url !== nextItem.url)
      );
    } finally {
      setLoadingCount(count => count - 1);
    }
  }, [queue, loadingCount, maxConcurrent, preloadImage]);

  useEffect(() => {
    processQueue();
  }, [queue, loadingCount, processQueue]);

  const isLoaded = useCallback((url: string) => {
    return queue.find(item => item.url === url)?.loaded || false;
  }, [queue]);

  const isLoading = useCallback((url: string) => {
    return queue.find(item => item.url === url)?.loading || false;
  }, [queue]);

  return {
    addToQueue,
    isLoaded,
    isLoading,
    queueLength: queue.length,
    loadedCount: queue.filter(item => item.loaded).length,
    averageLoadTime: queue.filter(item => item.loadTime).reduce((sum, item) => sum + (item.loadTime || 0), 0) / queue.filter(item => item.loadTime).length || 0
  };
};

export const useProfileImagePreloader = (profiles: any[]) => {
  const preloader = useImagePreloader({ maxConcurrent: 2 });

  useEffect(() => {
    if (profiles.length > 0) {
      // Create optimized image URLs with different priorities
      const imageItems = profiles.map((profile, index) => ({
        url: profile.mainPhoto || profile.coverPhoto,
        priority: index < 6 ? 10 : (index < 12 ? 5 : 1) // Higher priority for first 6, medium for next 6
      })).filter(item => item.url);

      // Temporarily disable smart preloader for testing
      // smartImagePreloader.preloadImagesIntelligently(imageItems, {
      //   immediate: 3, // Load first 3 immediately
      //   maxConcurrent: 2,
      //   delayBetweenBatches: 150
      // });

      // Also add to traditional queue for tracking
      const urls = imageItems.map(item => item.url);
      const highPriorityUrls = urls.slice(0, 6);
      const lowPriorityUrls = urls.slice(6);
      
      if (highPriorityUrls.length > 0) {
        preloader.addToQueue(highPriorityUrls, 10);
      }
      
      if (lowPriorityUrls.length > 0) {
        preloader.addToQueue(lowPriorityUrls, 1);
      }
    }
  }, [profiles, preloader.addToQueue]);

  return preloader;
};