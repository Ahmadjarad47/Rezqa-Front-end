import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private observer: IntersectionObserver | null = null;
  private lazyImages: Set<HTMLImageElement> = new Set();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.initIntersectionObserver();
    }
  }

  /**
   * Initialize intersection observer for lazy loading
   */
  private initIntersectionObserver(): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              this.loadImage(img);
              this.observer?.unobserve(img);
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.01
        }
      );
    }
  }

  /**
   * Add image for lazy loading
   */
  addLazyImage(img: HTMLImageElement): void {
    if (isPlatformBrowser(this.platformId) && this.observer) {
      this.lazyImages.add(img);
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  /**
   * Load image and remove from lazy loading set
   */
  private loadImage(img: HTMLImageElement): void {
    const src = img.getAttribute('data-src');
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
      img.classList.remove('lazy');
      img.classList.add('loaded');
      this.lazyImages.delete(img);
    }
  }

  /**
   * Preload critical resources
   */
  preloadResource(url: string, type: 'image' | 'script' | 'style' = 'image'): void {
    if (isPlatformBrowser(this.platformId)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = type;
      document.head.appendChild(link);
    }
  }

  /**
   * Preload multiple resources
   */
  preloadResources(resources: Array<{ url: string; type: 'image' | 'script' | 'style' }>): void {
    resources.forEach(resource => {
      this.preloadResource(resource.url, resource.type);
    });
  }

  /**
   * Prefetch route for faster navigation
   */
  prefetchRoute(route: string): void {
    if (isPlatformBrowser(this.platformId)) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    }
  }

  /**
   * Optimize images by converting to WebP if supported
   */
  optimizeImageUrl(url: string, width?: number, height?: number): string {
    if (isPlatformBrowser(this.platformId) && this.supportsWebP()) {
      // Add WebP format parameter if supported
      const separator = url.includes('?') ? '&' : '?';
      let optimizedUrl = `${url}${separator}format=webp`;
      
      if (width) {
        optimizedUrl += `&w=${width}`;
      }
      if (height) {
        optimizedUrl += `&h=${height}`;
      }
      
      return optimizedUrl;
    }
    return url;
  }

  /**
   * Check if browser supports WebP
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  }

  /**
   * Monitor performance metrics
   */
  monitorPerformance(): void {
    if (isPlatformBrowser(this.platformId) && 'performance' in window) {
      // Monitor Core Web Vitals
      this.monitorLCP();
      this.monitorFID();
      this.monitorCLS();
    }
  }

  /**
   * Monitor Largest Contentful Paint (LCP)
   */
  private monitorLCP(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  /**
   * Monitor First Input Delay (FID)
   */
  private monitorFID(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const firstInputEntry = entry as any;
          if (firstInputEntry.processingStart) {
            console.log('FID:', firstInputEntry.processingStart - firstInputEntry.startTime);
          }
        });
      });
      observer.observe({ entryTypes: ['first-input'] });
    }
  }

  /**
   * Monitor Cumulative Layout Shift (CLS)
   */
  private monitorCLS(): void {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        console.log('CLS:', clsValue);
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.lazyImages.clear();
  }
} 