import React, { useState, useRef, useEffect } from 'react';
import { getSupportedImageFormats, createProgressiveImageSources, getNetworkAwareImageUrl } from '../utils/imageOptimization';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  blurDataUrl?: string;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  srcSet?: string;
  priority?: boolean;
  width?: number;
  enableFormatOptimization?: boolean;
}

// Cache supported formats to avoid repeated checks
let cachedFormats: { webp: boolean; avif: boolean; jpeg: boolean } | null = null;

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlmYTFhNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9IjAuM2VtIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==',
  blurDataUrl,
  onLoad,
  onError,
  sizes,
  srcSet,
  priority = false,
  width = 800,
  enableFormatOptimization = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageSrc, setImageSrc] = useState(blurDataUrl || placeholder);
  const [optimizedSources, setOptimizedSources] = useState<{ srcSet: string; type?: string; sizes?: string }[]>([]);
  const [supportedFormats, setSupportedFormats] = useState<{ webp: boolean; avif: boolean; jpeg: boolean } | null>(null);

  // Initialize format support detection with timeout
  useEffect(() => {
    const initFormats = async () => {
      try {
        if (!cachedFormats) {
          // Add timeout to prevent hanging
          const formatPromise = getSupportedImageFormats();
          const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => resolve({ webp: false, avif: false, jpeg: true }), 1000);
          });
          
          cachedFormats = await Promise.race([formatPromise, timeoutPromise]) as { webp: boolean; avif: boolean; jpeg: boolean };
          console.log('Supported image formats:', cachedFormats);
        }
        setSupportedFormats(cachedFormats);
      } catch (error) {
        console.warn('Format detection failed, using fallback:', error);
        // Fallback to basic JPEG support
        const fallbackFormats = { webp: false, avif: false, jpeg: true };
        setSupportedFormats(fallbackFormats);
        cachedFormats = fallbackFormats;
      }
    };
    
    if (enableFormatOptimization) {
      initFormats();
    } else {
      // Skip format optimization entirely if disabled
      setSupportedFormats({ webp: false, avif: false, jpeg: true });
    }
  }, [enableFormatOptimization]);

  // Generate optimized sources when formats are detected
  useEffect(() => {
    if (supportedFormats && enableFormatOptimization && src) {
      const sources = createProgressiveImageSources(
        src,
        supportedFormats,
        [400, 800, 1200] // Default responsive widths
      );
      setOptimizedSources(sources);
    }
  }, [src, supportedFormats, enableFormatOptimization]);

  useEffect(() => {
    // Skip intersection observer for priority images
    if (priority) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Start loading 100px before the image is visible
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  useEffect(() => {
    if (isVisible && src) {
      const startTime = performance.now();
      
      // Use network-aware image URL
      const optimizedSrc = supportedFormats && enableFormatOptimization
        ? getNetworkAwareImageUrl(src, width, supportedFormats.webp ? 'webp' : 'jpeg')
        : src;
      
      const img = new Image();
      img.onload = () => {
        const loadTime = performance.now();
        setImageSrc(optimizedSrc);
        setIsLoading(false);
        setHasError(false);
        onLoad?.();
        
        // Report performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Enhanced image loaded in ${(loadTime - startTime).toFixed(2)}ms: ${optimizedSrc.substring(0, 50)}...`);
        }
      };
      img.onerror = () => {
        setIsLoading(false);
        setHasError(true);
        onError?.();
      };
      img.src = optimizedSrc;
    }
  }, [isVisible, src, onLoad, onError, supportedFormats, enableFormatOptimization, width]);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setIsLoading(false);
      // Set a default error image
      setImageSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlmYTFhNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9IjAuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+');
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Progressive image loading with format optimization */}
      {enableFormatOptimization && optimizedSources.length > 0 ? (
        <picture ref={imgRef}>
          {optimizedSources.map((source, index) => (
            <source
              key={index}
              srcSet={source.srcSet}
              type={source.type}
              sizes={source.sizes || sizes}
            />
          ))}
          <img
            src={imageSrc}
            alt={alt}
            className={`w-full h-full object-cover transition-all duration-500 ease-out ${
              isLoading 
                ? 'opacity-0 scale-105 blur-sm' 
                : 'opacity-100 scale-100 blur-0'
            }`}
            onError={handleImageError}
            onLoad={() => {
              setIsLoading(false);
              setHasError(false);
              onLoad?.();
            }}
            loading={priority ? 'eager' : 'lazy'}
          />
        </picture>
      ) : (
        <img
          ref={imgRef}
          src={imageSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-500 ease-out ${
            isLoading 
              ? 'opacity-0 scale-105 blur-sm' 
              : 'opacity-100 scale-100 blur-0'
          }`}
          onError={handleImageError}
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
            onLoad?.();
          }}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
      
      {/* Enhanced blur-up placeholder */}
      {blurDataUrl && isLoading && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
          style={{
            backgroundImage: `url(${blurDataUrl})`,
            filter: 'blur(8px)',
            transform: 'scale(1.1)', // Slightly larger to hide blur edges
          }}
        />
      )}
      
      {/* Loading indicator */}
      {isLoading && !blurDataUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded-full animate-bounce"></div>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          Failed to load
        </div>
      )}
    </div>
  );
};