// Enhanced image optimization utilities for better performance
import { getBestImageUrl, getNetworkAwareImageUrl } from './imageOptimization';

export const generateResponsiveSizes = (breakpoints: { [key: string]: number } = {}) => {
  const defaultBreakpoints = {
    sm: 320,
    md: 640,
    lg: 1024,
    xl: 1280,
    ...breakpoints
  };
  
  // Generate sizes string for responsive images
  return Object.entries(defaultBreakpoints)
    .map(([key, width]) => `(max-width: ${width}px) ${width}px`)
    .join(', ') + ', 100vw';
};

export const generateSrcSet = (baseUrl: string, widths: number[] = [320, 640, 768, 1024, 1280]) => {
  if (!baseUrl) return undefined;
  
  // For external URLs (like Pexels), generate different sizes if supported
  if (baseUrl.includes('pexels.com')) {
    return widths
      .map(width => `${baseUrl}&w=${width} ${width}w`)
      .join(', ');
  }
  
  // For Supabase URLs, use enhanced optimization
  if (baseUrl.includes('supabase.co/storage')) {
    return widths
      .map(width => `${getBestImageUrl(baseUrl, width, 'webp')} ${width}w`)
      .join(', ');
  }
  
  return undefined;
};

export const optimizeImageUrl = (url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  networkAware?: boolean;
} = {}) => {
  if (!url) return url;
  
  const { width, height, quality = 85, format, networkAware = false } = options;
  
  // Use network-aware optimization if enabled
  if (networkAware && width) {
    return getNetworkAwareImageUrl(url, width, format as 'webp' | 'avif' | 'jpeg');
  }
  
  // For Pexels images, add optimization parameters
  if (url.includes('pexels.com')) {
    let optimizedUrl = url;
    
    if (width) {
      optimizedUrl = optimizedUrl.includes('?') 
        ? `${optimizedUrl}&w=${width}` 
        : `${optimizedUrl}?w=${width}`;
    }
    
    if (height) {
      optimizedUrl = optimizedUrl.includes('?') 
        ? `${optimizedUrl}&h=${height}` 
        : `${optimizedUrl}?h=${height}`;
    }
    
    // Add quality and format if not already present
    if (!optimizedUrl.includes('auto=compress')) {
      optimizedUrl = optimizedUrl.includes('?') 
        ? `${optimizedUrl}&auto=compress` 
        : `${optimizedUrl}?auto=compress`;
    }
    
    return optimizedUrl;
  }
  
  // For Supabase Storage URLs, use enhanced optimization
  if (url.includes('supabase.co/storage')) {
    return getBestImageUrl(url, width || 800, format as 'webp' | 'avif' | 'jpeg');
  }
  
  // For other URLs, return as-is
  return url;
};

// Preload critical images
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.src = src;
  });
};

// Get image dimensions without loading the full image
export const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

// Generate responsive image sizes for different viewports
export const getResponsiveImageSizes = (viewMode: 'photographic' | 'directory') => {
  if (viewMode === 'photographic') {
    return {
      sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
      widths: [320, 640, 768, 1024]
    };
  } else {
    return {
      sizes: '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
      widths: [256, 384, 512, 640]
    };
  }
};