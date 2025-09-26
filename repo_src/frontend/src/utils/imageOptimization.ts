import imageCompression from 'browser-image-compression';

export interface ImageFormat {
  format: 'webp' | 'avif' | 'jpeg' | 'png';
  quality: number;
  size?: number;
}

export interface ImageVariant {
  width: number;
  height?: number;
  quality: number;
  format: 'webp' | 'avif' | 'jpeg';
  suffix: string;
}

// Image variants for different use cases
export const IMAGE_VARIANTS: Record<string, ImageVariant[]> = {
  profile: [
    { width: 150, quality: 85, format: 'webp', suffix: 'thumb' },
    { width: 400, quality: 85, format: 'webp', suffix: 'small' },
    { width: 800, quality: 85, format: 'webp', suffix: 'medium' },
    { width: 1200, quality: 85, format: 'webp', suffix: 'large' },
    // Fallback JPEG versions
    { width: 150, quality: 80, format: 'jpeg', suffix: 'thumb-jpg' },
    { width: 400, quality: 80, format: 'jpeg', suffix: 'small-jpg' },
    { width: 800, quality: 80, format: 'jpeg', suffix: 'medium-jpg' },
  ],
  event: [
    { width: 600, quality: 85, format: 'webp', suffix: 'banner' },
    { width: 1200, quality: 85, format: 'webp', suffix: 'hero' },
    { width: 1920, quality: 90, format: 'webp', suffix: 'full' },
    // Fallback JPEG versions
    { width: 600, quality: 80, format: 'jpeg', suffix: 'banner-jpg' },
    { width: 1200, quality: 80, format: 'jpeg', suffix: 'hero-jpg' },
  ]
};

// Generate a tiny placeholder image (base64 encoded blur)
export const generateBlurDataUrl = async (file: File): Promise<string> => {
  try {
    // Create a very small version for blur placeholder
    const blurOptions = {
      maxWidthOrHeight: 10,
      maxSizeMB: 0.01,
      useWebWorker: false,
      fileType: 'image/jpeg',
      initialQuality: 0.1
    };
    
    const tinyFile = await imageCompression(file, blurOptions);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(tinyFile);
    });
  } catch (error) {
    console.warn('Failed to generate blur placeholder:', error);
    // Return a default gray blur placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo=';
  }
};

// Create multiple optimized versions of an image
export const createImageVariants = async (
  file: File, 
  variantType: keyof typeof IMAGE_VARIANTS = 'profile'
): Promise<{ variant: ImageVariant; blob: Blob; dataUrl?: string }[]> => {
  const variants = IMAGE_VARIANTS[variantType];
  const results: { variant: ImageVariant; blob: Blob; dataUrl?: string }[] = [];
  
  console.log(`Creating ${variants.length} variants for ${variantType} image...`);
  
  for (const variant of variants) {
    try {
      const options = {
        maxWidthOrHeight: variant.width,
        maxSizeMB: 2, // Reasonable limit per variant
        useWebWorker: false,
        fileType: variant.format === 'jpeg' ? 'image/jpeg' : 
                 variant.format === 'webp' ? 'image/webp' : 'image/png',
        initialQuality: variant.quality / 100
      };
      
      console.log(`Creating ${variant.suffix} variant (${variant.width}px, ${variant.format})...`);
      const compressedFile = await imageCompression(file, options);
      
      results.push({
        variant,
        blob: compressedFile,
      });
      
      console.log(`✓ ${variant.suffix}: ${(compressedFile.size / 1024).toFixed(1)}KB`);
    } catch (error) {
      console.warn(`Failed to create ${variant.suffix} variant:`, error);
    }
  }
  
  return results;
};

// Browser format support detection
export const getSupportedImageFormats = (): Promise<{
  webp: boolean;
  avif: boolean;
  jpeg: boolean;
}> => {
  return new Promise((resolve) => {
    const formats = { webp: false, avif: false, jpeg: true };
    let checkedCount = 0;
    const totalChecks = 2;
    
    const checkComplete = () => {
      checkedCount++;
      if (checkedCount === totalChecks) {
        resolve(formats);
      }
    };
    
    // Test WebP support
    const webpTest = new Image();
    webpTest.onload = webpTest.onerror = () => {
      formats.webp = webpTest.width === 1;
      checkComplete();
    };
    webpTest.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    
    // Test AVIF support
    const avifTest = new Image();
    avifTest.onload = avifTest.onerror = () => {
      formats.avif = avifTest.width === 1;
      checkComplete();
    };
    avifTest.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAAFmF1eEMAAAAAdXJuOm1wZWc6bXBlZ0I6Y2ljcAAAAA5hdjFDgQ0MAAAAABBwaXhpAAAAAAPICAgAAAAWYXV4QwAAAAB1cm46bXBlZzptcGVnQjpjaWNwAAAADmF2MUOBDQwAAAAAEHBpeGkAAAAACwgICAAAABZhdXhDAAAAAHVybjptcGVnOm1wZWdCOmNpY3AAAAAOYXYxQ4ENDAAAAAATaXJlZgAAAAAAAAAOYXV4bAAAAgABAAEAAhgieG1wXG1ldGEAAAAAAAAAIGhhbmRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAAFmF1eEMAAAAAdXJuOm1wZWc6bXBlZ0I6Y2ljcAAAAA5hdjFDgQ0MAAAAABBwaXhpAAAAAAPICAgAAAAWYXV4QwAAAAB1cm46bXBlZzptcGVnQjpjaWNwAAAADmF2MUOBDQwAAAAAEHBpeGkAAAAACwgICAAAABZhdXhDAAAAAHVybjptcGVnOm1wZWdCOmNpY3AAAAAOYXYxQ4ENDAAAAAATaXJlZgAAAAAAAAAOYXV4bAAAAgABAAEAAA==';
  });
};

// Get the best image URL based on browser support and requirements
export const getBestImageUrl = (
  baseUrl: string,
  width: number,
  format?: 'webp' | 'avif' | 'jpeg'
): string => {
  if (!baseUrl) return baseUrl;
  
  // If it's already a Supabase storage URL, we can add transformation parameters
  if (baseUrl.includes('supabase.co/storage')) {
    const url = new URL(baseUrl);
    
    // Add transformation parameters if not already present
    if (!url.searchParams.has('width')) {
      url.searchParams.set('width', width.toString());
      url.searchParams.set('resize', 'contain');
      url.searchParams.set('quality', '85');
      
      if (format && format !== 'jpeg') {
        url.searchParams.set('format', format);
      }
    }
    
    return url.toString();
  }
  
  // For external URLs (like Pexels), apply existing optimization
  return baseUrl;
};

// Progressive image loading with format fallbacks
export const createProgressiveImageSources = (
  baseUrl: string,
  supportedFormats: { webp: boolean; avif: boolean; jpeg: boolean },
  widths: number[] = [400, 800, 1200]
) => {
  const sources: { srcSet: string; type?: string; sizes?: string }[] = [];
  
  // AVIF sources (best compression)
  if (supportedFormats.avif) {
    const avifSrcSet = widths
      .map(width => `${getBestImageUrl(baseUrl, width, 'avif')} ${width}w`)
      .join(', ');
    sources.push({
      srcSet: avifSrcSet,
      type: 'image/avif',
      sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    });
  }
  
  // WebP sources (good compression)
  if (supportedFormats.webp) {
    const webpSrcSet = widths
      .map(width => `${getBestImageUrl(baseUrl, width, 'webp')} ${width}w`)
      .join(', ');
    sources.push({
      srcSet: webpSrcSet,
      type: 'image/webp',
      sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    });
  }
  
  // JPEG fallback (universal support)
  const jpegSrcSet = widths
    .map(width => `${getBestImageUrl(baseUrl, width, 'jpeg')} ${width}w`)
    .join(', ');
  sources.push({
    srcSet: jpegSrcSet,
    type: 'image/jpeg',
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
  });
  
  return sources;
};

// Enhanced compression options for different use cases
export const getCompressionOptions = (
  purpose: 'thumbnail' | 'display' | 'hero' | 'upload',
  targetWidth?: number
) => {
  const baseOptions = {
    useWebWorker: false,
    fileType: 'image/jpeg' as const,
  };
  
  switch (purpose) {
    case 'thumbnail':
      return {
        ...baseOptions,
        maxWidthOrHeight: targetWidth || 150,
        maxSizeMB: 0.05,
        initialQuality: 0.7,
      };
    
    case 'display':
      return {
        ...baseOptions,
        maxWidthOrHeight: targetWidth || 800,
        maxSizeMB: 0.3,
        initialQuality: 0.85,
      };
    
    case 'hero':
      return {
        ...baseOptions,
        maxWidthOrHeight: targetWidth || 1600,
        maxSizeMB: 0.5,
        initialQuality: 0.8,
      };
    
    case 'upload':
      return {
        ...baseOptions,
        maxWidthOrHeight: targetWidth || 1200,
        maxSizeMB: 0.4,
        initialQuality: 0.75,
        fileType: 'image/jpeg' as const,
      };
    
    default:
      return {
        ...baseOptions,
        maxWidthOrHeight: 800,
        maxSizeMB: 0.5,
        initialQuality: 0.85,
      };
  }
};

// Create optimized image with multiple sizes
export const createOptimizedImage = async (
  file: File,
  purpose: 'profile' | 'event' = 'profile'
): Promise<{
  original: File;
  optimized: File;
  thumbnail: File;
  blurDataUrl: string;
  variants: { file: File; suffix: string; size: number }[];
}> => {
  console.log(`Creating optimized image variants for ${purpose}...`);
  
  // Generate blur placeholder first (fastest)
  const blurDataUrl = await generateBlurDataUrl(file);
  
  // Create different size variants
  const variants: { file: File; suffix: string; size: number }[] = [];
  
  // Thumbnail (150px)
  const thumbnailOptions = getCompressionOptions('thumbnail', 150);
  const thumbnail = await imageCompression(file, thumbnailOptions);
  variants.push({ file: thumbnail, suffix: 'thumb', size: 150 });
  
  // Display size (800px)
  const displayOptions = getCompressionOptions('display', 800);
  const display = await imageCompression(file, displayOptions);
  variants.push({ file: display, suffix: 'display', size: 800 });
  
  // Large size (1200px) - for hero images or high-quality viewing
  const largeOptions = getCompressionOptions('hero', 1200);
  const large = await imageCompression(file, largeOptions);
  variants.push({ file: large, suffix: 'large', size: 1200 });
  
  // Main optimized version (original size but compressed)
  const optimizedOptions = getCompressionOptions('upload');
  const optimized = await imageCompression(file, optimizedOptions);
  
  console.log('Image optimization completed:');
  console.log(`- Original: ${(file.size / 1024).toFixed(1)}KB`);
  console.log(`- Optimized: ${(optimized.size / 1024).toFixed(1)}KB`);
  console.log(`- Thumbnail: ${(thumbnail.size / 1024).toFixed(1)}KB`);
  console.log(`- Display: ${(display.size / 1024).toFixed(1)}KB`);
  console.log(`- Large: ${(large.size / 1024).toFixed(1)}KB`);
  
  return {
    original: file,
    optimized,
    thumbnail,
    blurDataUrl,
    variants
  };
};

// Network-aware image loading
export const getNetworkAwareImageUrl = (
  baseUrl: string,
  width: number,
  preferredFormat?: 'webp' | 'avif' | 'jpeg'
): string => {
  // Check for slow connection
  const connection = (navigator as any).connection;
  const isSlowConnection = connection && (
    connection.effectiveType === 'slow-2g' || 
    connection.effectiveType === '2g' ||
    connection.saveData
  );
  
  if (isSlowConnection) {
    // Use smaller size and more aggressive compression for slow connections
    const reducedWidth = Math.floor(width * 0.7);
    return getBestImageUrl(baseUrl, reducedWidth, 'jpeg');
  }
  
  return getBestImageUrl(baseUrl, width, preferredFormat);
};

// Preload critical images with priority
export const preloadCriticalImages = async (
  imageUrls: string[],
  maxConcurrent: number = 3
): Promise<void> => {
  console.log(`Preloading ${imageUrls.length} critical images...`);
  
  const loadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
      img.src = url;
    });
  };
  
  // Load images in batches to avoid overwhelming the browser
  const batches: string[][] = [];
  for (let i = 0; i < imageUrls.length; i += maxConcurrent) {
    batches.push(imageUrls.slice(i, i + maxConcurrent));
  }
  
  for (const batch of batches) {
    try {
      await Promise.allSettled(batch.map(loadImage));
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  }
  
  console.log('Critical image preloading completed');
};