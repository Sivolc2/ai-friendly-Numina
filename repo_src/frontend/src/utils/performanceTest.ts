// Performance testing utilities to measure image optimization improvements

import { imagePerformanceMonitor, getOptimizationRecommendations } from './imagePerformance';

export interface PerformanceTestResult {
  testName: string;
  averageLoadTime: number;
  cacheHitRate: number;
  totalImages: number;
  recommendations: string[];
  timestamp: number;
}

export class ImagePerformanceTester {
  private testResults: PerformanceTestResult[] = [];

  async runPerformanceTest(testName: string): Promise<PerformanceTestResult> {
    console.log(`🧪 Running performance test: ${testName}`);
    
    // Wait a moment for any pending loads to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const metrics = imagePerformanceMonitor.getMetrics();
    const result: PerformanceTestResult = {
      testName,
      averageLoadTime: metrics.averageLoadTime,
      cacheHitRate: metrics.cacheHitRate,
      totalImages: metrics.totalImages,
      recommendations: getOptimizationRecommendations(),
      timestamp: Date.now()
    };
    
    this.testResults.push(result);
    
    console.log(`📊 Test Results for ${testName}:`);
    console.log(`  Average Load Time: ${result.averageLoadTime.toFixed(1)}ms`);
    console.log(`  Cache Hit Rate: ${result.cacheHitRate.toFixed(1)}%`);
    console.log(`  Total Images: ${result.totalImages}`);
    console.log(`  Recommendations:`, result.recommendations);
    
    return result;
  }

  compareResults(beforeTest: string, afterTest: string): {
    loadTimeImprovement: number;
    cacheRateImprovement: number;
    summary: string;
  } | null {
    const before = this.testResults.find(r => r.testName === beforeTest);
    const after = this.testResults.find(r => r.testName === afterTest);
    
    if (!before || !after) {
      console.warn('Could not find test results for comparison');
      return null;
    }
    
    const loadTimeImprovement = ((before.averageLoadTime - after.averageLoadTime) / before.averageLoadTime) * 100;
    const cacheRateImprovement = after.cacheHitRate - before.cacheHitRate;
    
    const summary = `Performance improved by ${loadTimeImprovement.toFixed(1)}% faster loading, ${cacheRateImprovement.toFixed(1)}% better cache hit rate`;
    
    console.log(`📈 Performance Comparison: ${beforeTest} → ${afterTest}`);
    console.log(`  Load Time: ${before.averageLoadTime.toFixed(1)}ms → ${after.averageLoadTime.toFixed(1)}ms (${loadTimeImprovement > 0 ? '+' : ''}${loadTimeImprovement.toFixed(1)}%)`);
    console.log(`  Cache Rate: ${before.cacheHitRate.toFixed(1)}% → ${after.cacheHitRate.toFixed(1)}% (${cacheRateImprovement > 0 ? '+' : ''}${cacheRateImprovement.toFixed(1)}%)`);
    
    return {
      loadTimeImprovement,
      cacheRateImprovement,
      summary
    };
  }

  getAllResults(): PerformanceTestResult[] {
    return this.testResults;
  }

  getLatestResult(): PerformanceTestResult | null {
    return this.testResults[this.testResults.length - 1] || null;
  }
}

// Global performance tester instance
export const performanceTester = new ImagePerformanceTester();

// Quick performance check function for development
export const quickPerformanceCheck = (): void => {
  const metrics = imagePerformanceMonitor.getMetrics();
  
  console.log('🏃‍♂️ Quick Performance Check:');
  console.log(`  📸 Images loaded: ${metrics.totalImages}`);
  console.log(`  ⚡ Average load time: ${metrics.averageLoadTime.toFixed(1)}ms`);
  console.log(`  🎯 Cache hit rate: ${metrics.cacheHitRate.toFixed(1)}%`);
  console.log(`  🔄 Currently loading: ${metrics.currentlyLoading}`);
  
  const recommendations = getOptimizationRecommendations();
  if (recommendations.length > 0) {
    console.log('  💡 Recommendations:');
    recommendations.forEach(rec => console.log(`    - ${rec}`));
  }
};

// Development-only performance logging
if (process.env.NODE_ENV === 'development') {
  // Log performance summary every 30 seconds
  setInterval(() => {
    const metrics = imagePerformanceMonitor.getMetrics();
    if (metrics.totalImages > 0) {
      console.log(`🔍 Performance Summary: ${metrics.totalImages} images, ${metrics.averageLoadTime.toFixed(1)}ms avg, ${metrics.cacheHitRate.toFixed(1)}% cache hit rate`);
    }
  }, 30000);

  // Add global performance check function for manual testing
  (window as any).checkImagePerformance = quickPerformanceCheck;
  (window as any).imageMetrics = () => imagePerformanceMonitor.getMetrics();
}