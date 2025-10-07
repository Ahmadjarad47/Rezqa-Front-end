import {
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  Inject,
  HostListener,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CategoryDto, CarouselDto, HomeService } from '../../../core/services/home.service';
import { Router } from '@angular/router';
import { AuthService } from '@app/identity/services/auth.service';
import { Subject, takeUntil, catchError, of, finalize } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isAuthenticated = false;
  categories: CategoryDto[] = [];
  carousels: CarouselDto[] = [];
  loading = false;
  carouselLoading = false;
  error = false;
  carouselError = false;

  // Carousel state
  currentCarouselIndex = 0;
  carouselInterval: any;

  // Search input for home page
  homeSearchQuery: string = '';

  // 🚀 Advanced Touch & Gesture Support
  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;
  private isDragging = false;
  private dragThreshold = 50; // Minimum distance for swipe
  private autoPlayPaused = false;

  // 🎯 Performance & Animation State
  private animationFrameId: number | null = null;
  private isTransitioning = false;

  // Filtered categories for instant search
  get filteredCategories(): CategoryDto[] {
    const query = this.homeSearchQuery?.trim();
    if (!query) return this.categories;
    const lowerQuery = query.toLowerCase();
    return this.categories.filter(
      (cat) =>
        cat.title?.toLowerCase().includes(lowerQuery) ||
        cat.title?.toLowerCase().startsWith(lowerQuery)
    );
  }

  // App download URLs - Update these with your actual URLs
  readonly APK_DOWNLOAD_URL = 'https://example.com/syrainsooq-app.apk'; // Replace with actual APK URL
  readonly GOOGLE_PLAY_URL =
    'https://play.google.com/store/apps/details?id=com.syrainsooq.app'; // Replace with actual Play Store URL
  readonly APP_STORE_URL = 'https://apps.apple.com/app/syrainsooq/id123456789'; // Replace with actual App Store URL

  constructor(
    private router: Router,
    public homeService: HomeService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Preload categories and carousels for better performance
    this.homeService.preloadCategories();
    this.homeService.preloadCarousels();
    
    // Load categories and carousels with enhanced caching
    this.loadCategoriesWithCache();
    this.loadCarouselsWithCache();
    
    // Preload critical routes
    this.preloadCriticalRoutes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopCarousel();
    this.cleanupAnimations();
  }

  // 🚀 Advanced Touch & Gesture Methods
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (this.carousels.length <= 1) return;
    
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.isDragging = true;
    this.pauseAutoPlay();
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    
    event.preventDefault(); // Prevent scrolling
    this.touchEndX = event.touches[0].clientX;
    this.touchEndY = event.touches[0].clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.handleSwipe();
    this.resumeAutoPlay();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.carousels.length <= 1) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.nextCarousel();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.previousCarousel();
        break;
      case ' ':
        event.preventDefault();
        this.toggleAutoPlay();
        break;
    }
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.pauseAutoPlay();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.resumeAutoPlay();
  }

  // 🎯 Advanced Gesture Handling
  private handleSwipe(): void {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    
    // Check if it's a horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.dragThreshold) {
      if (deltaX > 0) {
        // Swipe right - go to previous
        this.previousCarousel();
      } else {
        // Swipe left - go to next
        this.nextCarousel();
      }
    }
  }

  private pauseAutoPlay(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.autoPlayPaused = true;
    }
  }

  private resumeAutoPlay(): void {
    if (this.autoPlayPaused && this.carousels.length > 1) {
      this.startCarousel();
      this.autoPlayPaused = false;
    }
  }

  private toggleAutoPlay(): void {
    if (this.carouselInterval) {
      this.pauseAutoPlay();
    } else {
      this.resumeAutoPlay();
    }
  }

  private cleanupAnimations(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loadCategoriesWithCache(): void {
    // Check if we have cached data
    const cachedData = this.getCachedCategories();
    if (cachedData && cachedData.length > 0) {
      this.categories = cachedData;
      return;
    }

    this.fetchCategories();
  }

  private getCachedCategories(): CategoryDto[] | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const cached = sessionStorage.getItem('home_categories');
        if (cached) {
          const data = JSON.parse(cached);
          const timestamp = data.timestamp;
          const now = Date.now();
          // Cache for 10 minutes (increased from 5 minutes)
          if (now - timestamp < 10 * 60 * 1000) {
            return data.categories;
          }
        }
      } catch (error) {
        console.warn('Error reading cached categories:', error);
      }
    }

    return null;
  }
  

  setCategory(category: CategoryDto) {
    this.homeService.setCategory(category);
    this.router.navigateByUrl('/all/' + category.title.replaceAll(' ', '-'));
  }

  private setCachedCategories(categories: CategoryDto[]): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const cacheData = {
          categories,
          timestamp: Date.now(),
        };
        sessionStorage.setItem('home_categories', JSON.stringify(cacheData));
      } catch (error) {
        console.warn('Error caching categories:', error);
      }
    }
  }

  fetchCategories(): void {
    if (this.loading) return; // Prevent multiple requests

    this.loading = true;
    this.error = false;

    this.homeService
      .getCategories()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error fetching categories:', error);
          this.error = true;
          return of({ items: [] });
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (result) => {
          const categories = result.items ?? result;
          this.categories = categories;
          this.setCachedCategories(categories);
        },
      });
  }

  private loadCarouselsWithCache(): void {
    // Check if we have cached data
    const cachedData = this.getCachedCarousels();
    if (cachedData && cachedData.length > 0) {
      this.carousels = cachedData;
      this.startCarousel();
      return;
    }

    this.fetchCarousels();
  }

  private getCachedCarousels(): CarouselDto[] | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const cached = sessionStorage.getItem('home_carousels');
        if (cached) {
          const data = JSON.parse(cached);
          const timestamp = data.timestamp;
          const now = Date.now();
          // Cache for 10 minutes
          if (now - timestamp < 10 * 60 * 1000) {
            return data.carousels;
          }
        }
      } catch (error) {
        console.warn('Error reading cached carousels:', error);
      }
    }

    return null;
  }

  private setCachedCarousels(carousels: CarouselDto[]): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const cacheData = {
          carousels,
          timestamp: Date.now(),
        };
        sessionStorage.setItem('home_carousels', JSON.stringify(cacheData));
      } catch (error) {
        console.warn('Error caching carousels:', error);
      }
    }
  }

  fetchCarousels(): void {
    if (this.carouselLoading) return; // Prevent multiple requests

    this.carouselLoading = true;
    this.carouselError = false;

    this.homeService
      .getCarousels()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error fetching carousels:', error);
          this.carouselError = true;
          return of([]);
        }),
        finalize(() => {
          this.carouselLoading = false;
        })
      )
      .subscribe({
        next: (carousels) => {
          this.carousels = carousels;
          this.setCachedCarousels(carousels);
          if (carousels.length > 0) {
            this.startCarousel();
            // Initialize advanced features after carousels load
            setTimeout(() => {
              this.optimizeImages();
              this.addParallaxEffect();
            }, 100);
          }
        },
      });
  }

  // 🚀 Enhanced Carousel Methods with Smooth Transitions
  startCarousel(): void {
    if (this.carousels.length <= 1) return;
    
    this.stopCarousel();
    this.carouselInterval = setInterval(() => {
      this.nextCarousel();
    }, 6000); // Increased to 6 seconds for better UX
  }

  stopCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  nextCarousel(): void {
    if (this.carousels.length > 0 && !this.isTransitioning) {
      this.isTransitioning = true;
      this.currentCarouselIndex = (this.currentCarouselIndex + 1) % this.carousels.length;
      
      // Reset transition flag after animation completes
      setTimeout(() => {
        this.isTransitioning = false;
      }, 1000);
    }
  }

  previousCarousel(): void {
    if (this.carousels.length > 0 && !this.isTransitioning) {
      this.isTransitioning = true;
      this.currentCarouselIndex = this.currentCarouselIndex === 0 
        ? this.carousels.length - 1 
        : this.currentCarouselIndex - 1;
      
      // Reset transition flag after animation completes
      setTimeout(() => {
        this.isTransitioning = false;
      }, 1000);
    }
  }

  goToCarousel(index: number): void {
    if (index >= 0 && index < this.carousels.length && !this.isTransitioning) {
      this.isTransitioning = true;
      this.currentCarouselIndex = index;
      
      // Reset transition flag after animation completes
      setTimeout(() => {
        this.isTransitioning = false;
      }, 1000);
    }
  }

  // 🎯 Advanced Carousel Controls
  pauseCarousel(): void {
    this.pauseAutoPlay();
  }

  playCarousel(): void {
    this.resumeAutoPlay();
  }

  // 🌟 Performance Optimized Methods
  private optimizeImages(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Lazy load images and optimize for performance
      const images = this.elementRef.nativeElement.querySelectorAll('img[loading="lazy"]');
      images.forEach((img: HTMLImageElement) => {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });
      });
    }
  }

  // 🎨 Enhanced Animation Methods
  private addParallaxEffect(): void {
    if (isPlatformBrowser(this.platformId)) {
      const carousel = this.elementRef.nativeElement.querySelector('.carousel-container');
      if (carousel) {
        carousel.addEventListener('mousemove', (e: MouseEvent) => {
          const rect = carousel.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          const moveX = (x - centerX) / 20;
          const moveY = (y - centerY) / 20;
          
          const images = carousel.querySelectorAll('.carousel-image');
          images.forEach((img: HTMLElement, index: number) => {
            if (index === this.currentCarouselIndex) {
              img.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;
            }
          });
        });
        
        carousel.addEventListener('mouseleave', () => {
          const images = carousel.querySelectorAll('.carousel-image');
          images.forEach((img: HTMLElement) => {
            img.style.transform = 'translate(0px, 0px) scale(1)';
          });
        });
      }
    }
  }

  onGetStarted(): void {
    if (this.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/all']);
    }
  }

  // Home page search submit
  onHomeSearchSubmit(): void {
    const query = this.homeSearchQuery?.trim();
    if (query) {
      // Navigate to the search results page (adjust route as needed)
      this.router.navigate(['/all']);
    }
  }

  // Preload critical routes for better navigation performance
  private preloadCriticalRoutes(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Preload the ads module since it's commonly accessed
      setTimeout(() => {
        import('../../../ads/ads.module').then(() => {
          console.log('Ads module preloaded');
        });
      }, 2000);
    }
  }

  // App download methods
  onDownloadAPK(): void {
    try {
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = this.APK_DOWNLOAD_URL;
      link.download = 'syrainsooq-app.apk';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      this.showDownloadNotification('تم بدء تحميل التطبيق', 'success');
    } catch (error) {
      console.error('Download failed:', error);
      this.showDownloadNotification('فشل في تحميل التطبيق', 'error');
    }
  }

  onGooglePlayDownload(): void {
    try {
      // Open Google Play Store in new tab
      window.open(this.GOOGLE_PLAY_URL, '_blank');

      // Show success message
      this.showDownloadNotification('تم فتح متجر Google Play', 'success');
    } catch (error) {
      console.error('Google Play redirect failed:', error);
      this.showDownloadNotification('فشل في فتح متجر Google Play', 'error');
    }
  }

  private showDownloadNotification(
    message: string,
    type: 'success' | 'error'
  ): void {
    // Create a simple notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg notification-enter ${
      type === 'success'
        ? 'bg-[#0061fe] text-white border border-[#0061fe]'
        : 'bg-red-500 text-white border border-red-400'
    }`;

    // Add icon based on type
    const icon = type === 'success' ? '✓' : '✗';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="text-lg mr-2">${icon}</span>
        <span>${message}</span>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('notification-enter');
      notification.classList.add('notification-exit');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Detect if user is on mobile device
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // Detect if user is on iOS device
  isIOSDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Detect if user is on Android device
  isAndroidDevice(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  // Smart download method that detects device and suggests appropriate download
  onSmartDownload(): void {
    if (this.isIOSDevice()) {
      // On iOS, redirect to App Store
      this.onAppStoreDownload();
    } else if (this.isAndroidDevice()) {
      // On Android, prefer Google Play Store
      this.onGooglePlayDownload();
    } else {
      // On desktop, prefer direct APK download
      this.onDownloadAPK();
    }
  }

  // App Store download method
  onAppStoreDownload(): void {
    try {
      // Open App Store in new tab
      window.open(this.APP_STORE_URL, '_blank');

      // Show success message
      this.showDownloadNotification('تم فتح App Store', 'success');
    } catch (error) {
      console.error('App Store redirect failed:', error);
      this.showDownloadNotification('فشل في فتح App Store', 'error');
    }
  }

  // Retry loading categories
  retryLoadCategories(): void {
    this.fetchCategories();
  }

  // Retry loading carousels
  retryLoadCarousels(): void {
    this.fetchCarousels();
  }
}
