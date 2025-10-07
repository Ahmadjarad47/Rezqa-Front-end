import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ImageConfig {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  lazy?: boolean;
  async?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ImageOptimizationService {
  private imageCache = new Map<string, string>();
  private observer: IntersectionObserver | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.initializeIntersectionObserver();
  }

  /**
   * تهيئة Intersection Observer للـ lazy loading
   */
  private initializeIntersectionObserver(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          this.loadImage(img);
          this.observer?.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px', // تحميل الصور قبل 50px من الظهور
      threshold: 0.1
    });
  }

  /**
   * تحميل صورة مع optimization
   */
  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset['src'];
    if (!src) return;

    // إنشاء صورة جديدة للتحميل المسبق
    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = src;
      img.classList.remove('opacity-0');
      img.classList.add('opacity-100');
    };
    tempImg.onerror = () => {
      // استخدام صورة بديلة في حالة الخطأ
      img.src = '/assets/images/placeholder.jpg';
      img.classList.remove('opacity-0');
      img.classList.add('opacity-100');
    };
    tempImg.src = src;
  }

  /**
   * تحسين URL الصورة حسب الجهاز والاتصال
   */
  optimizeImageUrl(originalUrl: string, config: Partial<ImageConfig> = {}): string {
    if (!isPlatformBrowser(this.platformId)) {
      return originalUrl;
    }

    // التحقق من الـ cache
    const cacheKey = `${originalUrl}-${JSON.stringify(config)}`;
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    let optimizedUrl = originalUrl;

    // إضافة معاملات التحسين
    const params = new URLSearchParams();

    // تحسين الجودة حسب سرعة الاتصال
    const connection = (navigator as any).connection;
    if (connection) {
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        params.set('quality', '60');
        params.set('width', '300');
      } else if (connection.effectiveType === '3g') {
        params.set('quality', '80');
        params.set('width', '600');
      } else {
        params.set('quality', '90');
      }
    }

    // تحسين حسب حجم الشاشة
    if (window.innerWidth < 768) {
      params.set('width', '400');
    } else if (window.innerWidth < 1024) {
      params.set('width', '600');
    } else {
      params.set('width', '800');
    }

    // إضافة معاملات التحسين للـ URL
    if (params.toString()) {
      optimizedUrl += (optimizedUrl.includes('?') ? '&' : '?') + params.toString();
    }

    // حفظ في الـ cache
    this.imageCache.set(cacheKey, optimizedUrl);
    return optimizedUrl;
  }

  /**
   * إنشاء عنصر صورة محسن
   */
  createOptimizedImage(config: ImageConfig): HTMLImageElement {
    const img = document.createElement('img');
    
    // إعداد الخصائص الأساسية
    img.alt = config.alt;
    img.loading = config.lazy !== false ? 'lazy' : 'eager';
    img.decoding = config.async !== false ? 'async' : 'sync';
    
    // إضافة classes للـ transition
    img.className = 'transition-opacity duration-300 opacity-0';
    
    // تحسين الـ URL
    const optimizedSrc = this.optimizeImageUrl(config.src, config);
    
    if (config.lazy !== false) {
      // استخدام data-src للـ lazy loading
      img.dataset['src'] = optimizedSrc;
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmMGYwZjAiLz48L3N2Zz4=';
      
      // إضافة للـ observer
      this.observer?.observe(img);
    } else {
      // تحميل فوري
      img.src = optimizedSrc;
      img.classList.remove('opacity-0');
      img.classList.add('opacity-100');
    }
    
    return img;
  }

  /**
   * تحميل مسبق للصور المهمة
   */
  preloadCriticalImages(imageUrls: string[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    imageUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = this.optimizeImageUrl(url);
      document.head.appendChild(link);
    });
  }

  /**
   * تنظيف الـ cache
   */
  clearCache(): void {
    this.imageCache.clear();
  }

  /**
   * الحصول على معلومات الصورة
   */
  getImageInfo(src: string): Promise<{width: number, height: number}> {
    return new Promise((resolve, reject) => {
      if (!isPlatformBrowser(this.platformId)) {
        reject(new Error('Not in browser'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  }

  /**
   * تحسين الصور في العنصر
   */
  optimizeImagesInElement(element: HTMLElement): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const images = element.querySelectorAll('img[data-src]');
    images.forEach(img => {
      this.observer?.observe(img);
    });
  }
} 