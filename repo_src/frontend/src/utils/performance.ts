// Simple performance monitoring for chat loading
export class ChatPerformanceMonitor {
  private static instance: ChatPerformanceMonitor;
  private timers: Map<string, number> = new Map();

  static getInstance() {
    if (!ChatPerformanceMonitor.instance) {
      ChatPerformanceMonitor.instance = new ChatPerformanceMonitor();
    }
    return ChatPerformanceMonitor.instance;
  }

  startTimer(label: string) {
    this.timers.set(label, performance.now());
    console.log(`⏱️ [PERF] Started: ${label}`);
  }

  endTimer(label: string) {
    const startTime = this.timers.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`✅ [PERF] ${label}: ${duration.toFixed(2)}ms`);
      this.timers.delete(label);
      return duration;
    }
    return 0;
  }

  logCacheHit(label: string) {
    console.log(`💾 [CACHE] Hit: ${label}`);
  }

  logCacheMiss(label: string) {
    console.log(`🔄 [CACHE] Miss: ${label}`);
  }
}

export const perf = ChatPerformanceMonitor.getInstance();