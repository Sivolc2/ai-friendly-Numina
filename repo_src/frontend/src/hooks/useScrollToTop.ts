import { useEffect } from 'react';

interface UseScrollToTopOptions {
  smooth?: boolean;
  offset?: number;
  skip?: boolean;
}

export const useScrollToTop = (
  dependencies: any[] = [], 
  options: UseScrollToTopOptions = {}
) => {
  const { smooth = false, offset = 0, skip = false } = options;

  useEffect(() => {
    if (skip) return;

    const scrollToTop = () => {
      if (smooth) {
        window.scrollTo({
          top: offset,
          left: 0,
          behavior: 'smooth'
        });
      } else {
        window.scrollTo(0, offset);
      }
    };

    // Multiple attempts to ensure scroll happens after content loads
    const timeoutId1 = setTimeout(scrollToTop, 10);
    const timeoutId2 = setTimeout(scrollToTop, 100);
    const timeoutId3 = setTimeout(scrollToTop, 300);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, dependencies);

  // Return manual scroll function for imperative use
  const scrollToTop = (customOptions?: UseScrollToTopOptions) => {
    const { smooth: customSmooth = smooth, offset: customOffset = offset } = customOptions || {};
    
    if (customSmooth) {
      window.scrollTo({
        top: customOffset,
        left: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo(0, customOffset);
    }
  };

  return { scrollToTop };
};