export interface PerformanceConfig {
  // Cache settings
  cacheExpiry: number;
  maxCacheSize: number;
  
  // Image optimization
  imageQuality: number;
  lazyLoadThreshold: number;
  
  // API settings
  apiTimeout: number;
  retryAttempts: number;
  
  // SignalR settings
  signalRReconnectAttempts: number;
  signalRReconnectDelay: number;
  
  // Preload settings
  preloadCriticalImages: string[];
  preloadCriticalResources: Array<{
    url: string;
    type: 'style' | 'script' | 'font';
  }>;
}

export const PERFORMANCE_CONFIG: PerformanceConfig = {
  // Cache settings (5 minutes)
  cacheExpiry: 1 * 60 * 1000,
  maxCacheSize: 50,
  
  // Image optimization
  imageQuality: 0.8,
  lazyLoadThreshold: 50,
  
  // API settings
  apiTimeout: 10000, // 10 seconds
  retryAttempts: 3,
  
  // SignalR settings
  signalRReconnectAttempts: 3,
  signalRReconnectDelay: 2000,
  
  // Preload settings
  preloadCriticalImages: [
    '/assets/images/hero-bg.jpg',
    '/assets/icons/logo.svg',
    '/assets/images/category-default.jpg'
  ],
  
  preloadCriticalResources: [
    { url: '/assets/styles/critical.css', type: 'style' },
    { url: '/assets/fonts/main-font.woff2', type: 'font' }
  ]
}; 