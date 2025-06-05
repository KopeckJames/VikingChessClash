// Analytics and performance tracking for SEO optimization

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export class AnalyticsManager {
  private static instance: AnalyticsManager;
  private isInitialized = false;

  static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  initialize() {
    if (this.isInitialized) return;
    
    // Track page performance metrics
    this.trackPerformanceMetrics();
    
    // Track user engagement
    this.setupEngagementTracking();
    
    this.isInitialized = true;
  }

  trackEvent(event: AnalyticsEvent) {
    // Generic event tracking that can be extended with Google Analytics, etc.
    console.log('Analytics Event:', event);
    
    // Store in localStorage for basic analytics
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    events.push({
      ...event,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('analytics_events', JSON.stringify(events));
  }

  trackPageView(page: string, title: string) {
    this.trackEvent({
      action: 'page_view',
      category: 'navigation',
      label: page
    });

    // Update performance metrics
    const performanceData = this.getPerformanceData();
    console.log('Page Performance:', performanceData);
  }

  trackGameAction(action: string, gameId?: number) {
    this.trackEvent({
      action,
      category: 'game',
      label: gameId ? `game_${gameId}` : undefined,
      value: gameId
    });
  }

  trackUserAction(action: string, details?: string) {
    this.trackEvent({
      action,
      category: 'user',
      label: details
    });
  }

  private trackPerformanceMetrics() {
    // Track Core Web Vitals for SEO
    if ('web-vital' in window) return;

    // Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.trackEvent({
            action: 'lcp',
            category: 'performance',
            value: Math.round(entry.startTime)
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Browser doesn't support this metric
    }

    // First Input Delay (FID) - tracks when available
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'first-input') {
          this.trackEvent({
            action: 'fid',
            category: 'performance',
            value: Math.round((entry as any).processingStart - entry.startTime)
          });
        }
      }
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // Browser doesn't support this metric
    }
  }

  private setupEngagementTracking() {
    // Track time on page
    let startTime = Date.now();
    
    const trackTimeOnPage = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      this.trackEvent({
        action: 'time_on_page',
        category: 'engagement',
        value: timeSpent
      });
    };

    // Track before page unload
    window.addEventListener('beforeunload', trackTimeOnPage);
    
    // Track every 30 seconds for active sessions
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        trackTimeOnPage();
        startTime = Date.now(); // Reset for next interval
      }
    }, 30000);

    // Track scroll depth
    let maxScrollDepth = 0;
    const trackScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        
        // Track milestone scroll depths
        if (scrollPercent >= 25 && maxScrollDepth < 25) {
          this.trackEvent({
            action: 'scroll_25',
            category: 'engagement'
          });
        } else if (scrollPercent >= 50 && maxScrollDepth < 50) {
          this.trackEvent({
            action: 'scroll_50',
            category: 'engagement'
          });
        } else if (scrollPercent >= 75 && maxScrollDepth < 75) {
          this.trackEvent({
            action: 'scroll_75',
            category: 'engagement'
          });
        } else if (scrollPercent >= 90 && maxScrollDepth < 90) {
          this.trackEvent({
            action: 'scroll_90',
            category: 'engagement'
          });
        }
      }
    };

    window.addEventListener('scroll', trackScrollDepth, { passive: true });
  }

  private getPerformanceData() {
    if (!window.performance) return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      // Page load metrics
      pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      firstPaint: this.getFirstPaint(),
      
      // Network metrics
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnection: navigation.connectEnd - navigation.connectStart,
      serverResponse: navigation.responseEnd - navigation.requestStart,
      
      // Resource timing
      resources: performance.getEntriesByType('resource').length
    };
  }

  private getFirstPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  // Export analytics data for SEO analysis
  exportAnalyticsData() {
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    const performanceData = this.getPerformanceData();
    
    return {
      events,
      performance: performanceData,
      exportedAt: new Date().toISOString(),
      url: window.location.origin
    };
  }
}

export const analytics = AnalyticsManager.getInstance();