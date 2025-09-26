import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  imagesLoadedCount: number;
  totalImages: number;
  averageImageLoadTime: number;
  timeToFirstImage: number;
  initialRenderTime: number;
}

export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    imagesLoadedCount: 0,
    totalImages: 0,
    averageImageLoadTime: 0,
    timeToFirstImage: 0,
    initialRenderTime: 0
  });

  const [imageLoadTimes, setImageLoadTimes] = useState<number[]>([]);
  const [startTime] = useState(() => performance.now());
  const [firstImageTime, setFirstImageTime] = useState<number | null>(null);

  useEffect(() => {
    // Record initial render time
    const renderTime = performance.now() - startTime;
    setMetrics(prev => ({ ...prev, initialRenderTime: renderTime }));

    // Get page load time from Navigation API
    const pageLoadTime = performance.timing 
      ? performance.timing.loadEventEnd - performance.timing.navigationStart 
      : 0;
    
    setMetrics(prev => ({ ...prev, pageLoadTime }));
  }, [startTime]);

  const recordImageLoad = (loadTime: number) => {
    if (firstImageTime === null) {
      setFirstImageTime(loadTime);
      setMetrics(prev => ({ ...prev, timeToFirstImage: loadTime - startTime }));
    }

    setImageLoadTimes(prev => {
      const newTimes = [...prev, loadTime - startTime];
      const averageLoadTime = newTimes.reduce((a, b) => a + b, 0) / newTimes.length;
      
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        imagesLoadedCount: newTimes.length,
        averageImageLoadTime: averageLoadTime
      }));
      
      return newTimes;
    });
  };

  const setTotalImages = (total: number) => {
    setMetrics(prev => ({ ...prev, totalImages: total }));
  };

  const getLoadingProgress = () => {
    return metrics.totalImages > 0 ? metrics.imagesLoadedCount / metrics.totalImages : 0;
  };

  return {
    metrics,
    recordImageLoad,
    setTotalImages,
    getLoadingProgress,
    isComplete: metrics.imagesLoadedCount === metrics.totalImages && metrics.totalImages > 0
  };
};

// Hook to measure Cumulative Layout Shift (CLS)
export const useLayoutShiftMetrics = () => {
  const [cls, setCls] = useState(0);

  useEffect(() => {
    let clsValue = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only count layout shifts that don't have recent user input
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          setCls(clsValue);
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    return () => observer.disconnect();
  }, []);

  return cls;
};

// Hook to measure Largest Contentful Paint (LCP)
export const useLCPMetrics = () => {
  const [lcp, setLcp] = useState(0);

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      setLcp(lastEntry.startTime);
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    return () => observer.disconnect();
  }, []);

  return lcp;
};