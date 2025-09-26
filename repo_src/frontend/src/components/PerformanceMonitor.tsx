import React, { useState, useEffect } from 'react';
import { usePerformanceMetrics, useLayoutShiftMetrics, useLCPMetrics } from '../hooks/usePerformanceMetrics';

interface PerformanceMonitorProps {
  totalImages: number;
  onImageLoad: (loadTime: number) => void;
  enabled?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  totalImages, 
  onImageLoad,
  enabled = process.env.NODE_ENV === 'development'
}) => {
  const { metrics, recordImageLoad, setTotalImages, getLoadingProgress } = usePerformanceMetrics();
  const cls = useLayoutShiftMetrics();
  const lcp = useLCPMetrics();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTotalImages(totalImages);
  }, [totalImages, setTotalImages]);

  // Record image load when callback is triggered
  useEffect(() => {
    if (onImageLoad) {
      // Override the callback to also record performance
      const originalCallback = onImageLoad;
      onImageLoad = (loadTime: number) => {
        recordImageLoad(loadTime);
        originalCallback(loadTime);
      };
    }
  }, [onImageLoad, recordImageLoad]);

  if (!enabled) return null;

  const formatTime = (ms: number) => `${ms.toFixed(0)}ms`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-2 rounded-full shadow-lg z-50 hover:bg-purple-700"
        title="Performance Monitor"
      >
        📊
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 w-80">
          <div className="text-lg font-semibold mb-3 text-gray-800">Performance Metrics</div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Initial Render:</span>
              <span className="font-mono">{formatTime(metrics.initialRenderTime)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Time to First Image:</span>
              <span className="font-mono">{formatTime(metrics.timeToFirstImage)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Images Loaded:</span>
              <span className="font-mono">
                {metrics.imagesLoadedCount}/{metrics.totalImages}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getLoadingProgress() * 100}%` }}
              />
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Image Load:</span>
              <span className="font-mono">{formatTime(metrics.averageImageLoadTime)}</span>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-600">LCP:</span>
                <span className={`font-mono ${lcp > 2500 ? 'text-red-500' : lcp > 1000 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {formatTime(lcp)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">CLS:</span>
                <span className={`font-mono ${cls > 0.25 ? 'text-red-500' : cls > 0.1 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {cls.toFixed(3)}
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-3 space-y-1">
              <div>• LCP &lt; 1s: Good, &lt; 2.5s: Needs improvement</div>
              <div>• CLS &lt; 0.1: Good, &lt; 0.25: Needs improvement</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};