import { supabase } from '../lib/supabase';

interface QueryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  timeout?: number;
  cacheKey?: string;
  cacheTtl?: number;
  fallbackData?: any;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

class RobustQueryManager {
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
  private readonly MOBILE_CIRCUIT_BREAKER_THRESHOLD = 3; // Lower threshold for mobile
  private readonly MOBILE_CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds for mobile

  async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    options: QueryOptions = {}
  ): Promise<{ data: T | null; error: any; fromCache?: boolean }> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 8000,
      timeout = 10000,
      cacheKey,
      cacheTtl = 300000, // 5 minutes
      fallbackData = null
    } = options;

    const operationKey = cacheKey || 'default';

    // Check cache first
    if (cacheKey) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log(`RobustQuery: Cache hit for ${cacheKey}`);
        return { data: cached, error: null, fromCache: true };
      }
    }

    // Check circuit breaker
    if (this.isCircuitOpen(operationKey)) {
      console.warn(`RobustQuery: Circuit breaker open for ${operationKey}, using fallback`);
      return { data: fallbackData, error: { message: 'Circuit breaker open', code: 'CIRCUIT_OPEN' } };
    }

    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`RobustQuery: Attempt ${attempt + 1}/${maxRetries + 1} for ${operationKey}`);

        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        );

        // Execute query with timeout
        const result = await Promise.race([
          queryFn(),
          timeoutPromise
        ]) as { data: T | null; error: any };

        if (!result.error && result.data !== null) {
          // Success - reset circuit breaker and cache result
          this.resetCircuitBreaker(operationKey);
          
          if (cacheKey) {
            this.setCache(cacheKey, result.data, cacheTtl);
          }

          console.log(`RobustQuery: Success on attempt ${attempt + 1} for ${operationKey}`);
          return result;
        }

        lastError = result.error || new Error('No data returned');
        
        // Don't retry on certain error types
        if (this.isNonRetryableError(lastError)) {
          console.log(`RobustQuery: Non-retryable error for ${operationKey}:`, lastError);
          break;
        }

      } catch (error) {
        lastError = error;
        console.warn(`RobustQuery: Attempt ${attempt + 1} failed for ${operationKey}:`, error);
      }

      // Wait before retry (exponential backoff with jitter)
      if (attempt < maxRetries) {
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelay
        );
        console.log(`RobustQuery: Waiting ${delay}ms before retry ${attempt + 2}`);
        await this.sleep(delay);
      }
    }

    // All attempts failed - record circuit breaker failure
    this.recordFailure(operationKey);

    console.error(`RobustQuery: All attempts failed for ${operationKey}, using fallback`);
    
    // Try to return cached data even if expired
    if (cacheKey) {
      const expiredCache = this.getFromCache(cacheKey, true);
      if (expiredCache) {
        console.log(`RobustQuery: Using expired cache for ${cacheKey}`);
        return { data: expiredCache, error: lastError, fromCache: true };
      }
    }

    return { data: fallbackData, error: lastError };
  }

  private getFromCache(key: string, allowExpired = false): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (!allowExpired && now > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Also store in localStorage for persistence across sessions
    try {
      localStorage.setItem(`robust_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl
      }));
    } catch (error) {
      console.warn('Failed to store cache in localStorage:', error);
    }
  }

  private isCircuitOpen(operationKey: string): boolean {
    const breaker = this.circuitBreakers.get(operationKey);
    if (!breaker) return false;

    const now = Date.now();
    const isMobile = this.isMobileDevice();
    const timeout = isMobile ? this.MOBILE_CIRCUIT_BREAKER_TIMEOUT : this.CIRCUIT_BREAKER_TIMEOUT;

    if (breaker.state === 'open') {
      if (now - breaker.lastFailure > timeout) {
        breaker.state = 'half-open';
        console.log(`RobustQuery: Circuit breaker half-open for ${operationKey} (mobile: ${isMobile})`);
      }
      return breaker.state === 'open';
    }

    return false;
  }
  
  // Add method to manually reset circuit breaker
  public resetCircuitBreakerForOperation(operationKey: string): void {
    const breaker = this.circuitBreakers.get(operationKey);
    if (breaker) {
      console.log(`RobustQuery: Manually resetting circuit breaker for ${operationKey}`);
      breaker.failures = 0;
      breaker.state = 'closed';
      this.circuitBreakers.set(operationKey, breaker);
    }
  }
  
  // Reset all circuit breakers (useful for mobile recovery)
  public resetAllCircuitBreakers(): void {
    console.log('RobustQuery: Resetting all circuit breakers');
    this.circuitBreakers.forEach((breaker, key) => {
      breaker.failures = 0;
      breaker.state = 'closed';
    });
  }
  
  // Clear cache for a specific key
  public clearCache(cacheKey: string): void {
    this.cache.delete(cacheKey);
    try {
      localStorage.removeItem(`robust_cache_${cacheKey}`);
    } catch {}
  }
  
  private isMobileDevice(): boolean {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
      (window.innerWidth <= 768 && 'ontouchstart' in window);
  }

  private recordFailure(operationKey: string): void {
    const isMobile = this.isMobileDevice();
    const threshold = isMobile ? this.MOBILE_CIRCUIT_BREAKER_THRESHOLD : this.CIRCUIT_BREAKER_THRESHOLD;
    
    const breaker = this.circuitBreakers.get(operationKey) || {
      failures: 0,
      lastFailure: 0,
      state: 'closed' as const
    };

    breaker.failures++;
    breaker.lastFailure = Date.now();

    if (breaker.failures >= threshold) {
      breaker.state = 'open';
      console.warn(`RobustQuery: Circuit breaker opened for ${operationKey} after ${breaker.failures} failures (threshold: ${threshold}, mobile: ${isMobile})`);
    }

    this.circuitBreakers.set(operationKey, breaker);
  }

  private resetCircuitBreaker(operationKey: string): void {
    const breaker = this.circuitBreakers.get(operationKey);
    if (breaker) {
      breaker.failures = 0;
      breaker.state = 'closed';
    }
  }

  private isNonRetryableError(error: any): boolean {
    if (!error) return false;
    
    const nonRetryableCodes = [
      'PGRST301', // Ambiguous
      'PGRST100', // Bad request
      '23505',    // Unique constraint violation
      '42P01',    // Table doesn't exist
    ];

    return nonRetryableCodes.includes(error.code) || 
           error.message?.includes('permission denied') ||
           error.message?.includes('invalid') ||
           error.status === 400;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Initialize cache from localStorage on startup
  initializeCacheFromStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('robust_cache_'));
      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          const cacheKey = key.replace('robust_cache_', '');
          
          // Only restore if not expired
          if (Date.now() < parsed.timestamp + parsed.ttl) {
            this.cache.set(cacheKey, parsed);
            console.log(`RobustQuery: Restored cache for ${cacheKey} from localStorage`);
          } else {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to initialize cache from localStorage:', error);
    }
  }
}

// Export singleton instance
export const robustQuery = new RobustQueryManager();

// Initialize cache on module load
robustQuery.initializeCacheFromStorage();

// Export utility functions for circuit breaker management
export const resetProfileCircuitBreaker = (userId: string) => {
  robustQuery.resetCircuitBreakerForOperation(`profile_${userId}`);
  robustQuery.clearCache(`profile_${userId}`);
};

export const resetProfilesListCache = () => {
  robustQuery.resetCircuitBreakerForOperation('profiles_list');
  robustQuery.clearCache('profiles_list');
  console.log('Cleared profiles list cache and reset circuit breaker');
};

export const resetAllCircuitBreakers = () => {
  robustQuery.resetAllCircuitBreakers();
};

// Detect if running on mobile device
const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
    (window.innerWidth <= 768 && 'ontouchstart' in window);
};

// Utility function for profile queries with mobile optimization
export const fetchProfileRobust = (userId: string) => {
  const isMobile = isMobileDevice();
  
  // Adjust parameters for mobile devices
  const mobileParams = {
    maxRetries: 4,     // More retries for mobile
    baseDelay: 1000,   // Longer initial delay
    maxDelay: 6000,    // Higher max delay
    timeout: 10000,    // Double timeout for mobile (10s)
    cacheKey: `profile_${userId}`,
    cacheTtl: 300000,  // 5 minutes
    fallbackData: null
  };
  
  const desktopParams = {
    maxRetries: 3,
    baseDelay: 500,
    maxDelay: 4000,
    timeout: 5000,
    cacheKey: `profile_${userId}`,
    cacheTtl: 300000,  // 5 minutes
    fallbackData: null
  };
  
  const params = isMobile ? mobileParams : desktopParams;
  
  if (isMobile) {
    console.log('RobustQuery: Using mobile-optimized parameters for profile fetch');
  }
  
  return robustQuery.executeQuery(
    () => supabase
      .from('profiles')
      .select('id, name, email, role')
      .eq('user_id', userId)
      .limit(1),
    params
  );
};

// Utility function for conversations queries
export const fetchConversationsRobust = (profileId: string) => {
  return robustQuery.executeQuery(
    () => supabase.rpc('get_conversations_with_participants', { profile_id: profileId }),
    {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 5000,
      timeout: 8000,
      cacheKey: `conversations_${profileId}`,
      cacheTtl: 60000, // 1 minute (conversations change frequently)
      fallbackData: []
    }
  );
};

// Utility function for profiles list queries
export const fetchProfilesListRobust = () => {
  return robustQuery.executeQuery(
    () => supabase
      .from('profiles')
      .select('id,name,email,role,story,main_photo,cover_photo,social_links,custom_links,messenger_platforms,tags,event_id,location,is_public,has_completed_profile,video_url,created_at,updated_at,published_profile')
      .eq('published_profile', true)
      .eq('has_completed_profile', true)
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
    {
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 10000,
      timeout: 30000, // Increased to 30 seconds
      cacheKey: 'profiles_list',
      cacheTtl: 300000, // 5 minutes
      fallbackData: []
    }
  );
};