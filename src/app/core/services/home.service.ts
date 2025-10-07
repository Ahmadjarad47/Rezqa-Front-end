import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  of,
  shareReplay,
  catchError,
  timeout,
  EMPTY,
  retry,
  delay,
  timer,
} from 'rxjs';
import { environment } from '@environments/environment.development';
import { isPlatformBrowser } from '@angular/common';
import { TransferState, makeStateKey } from '@angular/core';

export interface CategoryDto {
  id: number;
  title: string;
  image?: string;
  description: string;
}

export interface CarouselDto {
  id: number;
  title?: string;
  imageUrl: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  private apiUrl = environment.apiUrl + 'Home/category';
  private carouselApiUrl = environment.apiUrl + 'Home/carousel';
  private saveCategorySource = new BehaviorSubject<CategoryDto | null>(null);
  private categoryKey = makeStateKey<CategoryDto | null>('categoryKey');

  private categoriesCache$: Observable<PaginatedResult<CategoryDto>> | null = null;
  private carouselsCache$: Observable<CarouselDto[]> | null = null;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes (increased from 1 minute)
  private lastCacheTime = 0;
  private lastCarouselCacheTime = 0;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private transferState: TransferState
  ) {}

  getCategories(): Observable<PaginatedResult<CategoryDto>> {
    if (!isPlatformBrowser(this.platformId)) {
      return EMPTY;
    }

    const now = Date.now();
    if (this.categoriesCache$ && now - this.lastCacheTime < this.cacheExpiry) {
      return this.categoriesCache$;
    }

    this.categoriesCache$ = this.http
      .get<PaginatedResult<CategoryDto>>(this.apiUrl)
      .pipe(
        timeout(8000), // Reduced timeout for faster failure detection
        retry({
          count: this.retryAttempts,
          delay: (error, retryCount) => {
            console.warn(`Retry attempt ${retryCount} for categories API`);
            return timer(this.retryDelay * retryCount);
          }
        }),
        catchError((error) => {
          console.error('Error fetching categories:', error);
          // Return cached data if available, otherwise empty result
          const cachedData = this.getCachedCategories();
          if (cachedData && cachedData.length > 0) {
            return of({
              items: cachedData,
              pageNumber: 1,
              pageSize: cachedData.length,
              totalCount: cachedData.length,
              totalPages: 1,
              hasPreviousPage: false,
              hasNextPage: false,
            });
          }
          return of({
            items: [],
            pageNumber: 1,
            pageSize: 6,
            totalCount: 0,
            totalPages: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          });
        }),
        shareReplay(1)
      );

    this.lastCacheTime = now;
    return this.categoriesCache$;
  }

  clearCache(): void {
    this.categoriesCache$ = null;
    this.lastCacheTime = 0;
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.removeItem('home_categories');
      } catch (error) {
        console.warn('Error clearing cache:', error);
      }
    }
  }

  setCategory(category: CategoryDto | null): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.setItem('selectedCategory', JSON.stringify(category));
      } catch (error) {
        console.warn('Error saving category to session storage:', error);
      }
    } else {
      this.transferState.set(this.categoryKey, category);
    }

    this.saveCategorySource.next(category);
  }

  getCategory(): CategoryDto | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const cached = sessionStorage.getItem('selectedCategory');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.warn('Error reading cached category:', error);
      }
    } else {
      return this.transferState.get(this.categoryKey, null);
    }
    return null;
  }

  getCategoryObservable(): Observable<CategoryDto | null> {
    return this.saveCategorySource.asObservable();
  }

  // Enhanced caching methods
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

  // Preload categories for better performance
  preloadCategories(): void {
    if (isPlatformBrowser(this.platformId) && !this.categoriesCache$) {
      this.getCategories().subscribe();
    }
  }

  getCarousels(): Observable<CarouselDto[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return EMPTY;
    }

    const now = Date.now();
    if (this.carouselsCache$ && now - this.lastCarouselCacheTime < this.cacheExpiry) {
      return this.carouselsCache$;
    }

    this.carouselsCache$ = this.http
      .get<CarouselDto[]>(this.carouselApiUrl)
      .pipe(
        timeout(8000),
        retry({
          count: this.retryAttempts,
          delay: (error, retryCount) => {
            console.warn(`Retry attempt ${retryCount} for carousels API`);
            return timer(this.retryDelay * retryCount);
          }
        }),
        catchError((error) => {
          console.error('Error fetching carousels:', error);
          // Return cached data if available, otherwise empty array
          const cachedData = this.getCachedCarousels();
          if (cachedData && cachedData.length > 0) {
            return of(cachedData);
          }
          return of([]);
        }),
        shareReplay(1)
      );

    this.lastCarouselCacheTime = now;
    return this.carouselsCache$;
  }

  clearCarouselCache(): void {
    this.carouselsCache$ = null;
    this.lastCarouselCacheTime = 0;
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.removeItem('home_carousels');
      } catch (error) {
        console.warn('Error clearing carousel cache:', error);
      }
    }
  }

  // Enhanced caching methods for carousels
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

  // Preload carousels for better performance
  preloadCarousels(): void {
    if (isPlatformBrowser(this.platformId) && !this.carouselsCache$) {
      this.getCarousels().subscribe();
    }
  }
}
