import { useEffect } from 'react';

interface ScrollToTopOptions {
  smooth?: boolean;
  skip?: boolean;
}

export function useScrollToTop(deps: any[], options: ScrollToTopOptions = {}) {
  const { smooth = false, skip = false } = options;

  useEffect(() => {
    if (skip) return;

    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, deps);
}