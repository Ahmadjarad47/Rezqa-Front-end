import { Directive, ElementRef, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ImageOptimizationService, ImageConfig } from '../services/image-optimization.service';

@Directive({
  selector: '[appOptimizedImage]',
  standalone: false
})
export class OptimizedImageDirective implements OnInit, OnDestroy {
  @Input() appOptimizedImage: string = '';
  @Input() alt: string = '';
  @Input() width?: number;
  @Input() height?: number;
  @Input() quality?: number;
  @Input() lazy: boolean = true;
  @Input() async: boolean = true;

  private img: HTMLImageElement | null = null;

  constructor(
    private el: ElementRef,
    private imageService: ImageOptimizationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.appOptimizedImage) {
      return;
    }

    this.createOptimizedImage();
  }

  ngOnDestroy(): void {
    if (this.img) {
      this.imageService['observer']?.unobserve(this.img);
    }
  }

  private createOptimizedImage(): void {
    const config: ImageConfig = {
      src: this.appOptimizedImage,
      alt: this.alt,
      width: this.width,
      height: this.height,
      quality: this.quality,
      lazy: this.lazy,
      async: this.async
    };

    // إنشاء عنصر الصورة المحسن
    this.img = this.imageService.createOptimizedImage(config);

    // إضافة classes إضافية
    this.img.className += ' w-full h-full object-cover';

    // إضافة للعنصر
    this.el.nativeElement.appendChild(this.img);
  }
} 