import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { PerformanceService } from '../services/performance.service';

@Directive({
  selector: '[appLazyImage]',
  standalone: false
})
export class LazyImageDirective implements OnInit, OnDestroy {
  @Input() appLazyImage: string = '';
  @Input() fallback: string = '';
  @Input() alt: string = '';

  private observer: IntersectionObserver | null = null;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private performanceService: PerformanceService
  ) {}

  ngOnInit(): void {
    this.setupLazyLoading();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupLazyLoading(): void {
    const img = this.el.nativeElement;
    
    // Set placeholder or low-quality image
    if (this.fallback) {
      img.src = this.fallback;
    }

    // Set alt text
    if (this.alt) {
      img.alt = this.alt;
    }

    // Add lazy loading class
    img.classList.add('lazy');

    // Store the actual image URL
    img.setAttribute('data-src', this.appLazyImage);

    // Use performance service for lazy loading
    this.performanceService.addLazyImage(img);

    // Fallback for browsers without IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      this.loadImage(img);
    }
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.getAttribute('data-src');
    if (src) {
      // Create a new image to preload
      const tempImg = new Image();
      
      tempImg.onload = () => {
        img.src = src;
        img.removeAttribute('data-src');
        img.classList.remove('lazy');
        img.classList.add('loaded');
      };

      tempImg.onerror = () => {
        // Handle error by keeping fallback or showing error state
        img.classList.add('error');
        console.warn('Failed to load image:', src);
      };

      tempImg.src = src;
    }
  }
} 