import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { environment } from '@environments/environment.development';
import { isPlatformBrowser } from '@angular/common';

export interface WishlistItem {
  adId: number;
  title: string;
  description: string;
  price: number;
  imageUrl?: string[];
  location: string;
  categoryName: string;
  subCategoryName: string;
  addedAt: string;
}

export interface WishlistResponse {
  isSuccess: boolean;
  message: string;
  items: WishlistItem[];
  totalCount: number;
}

export interface AddToWishlistRequest {
  adId: number;
}

export interface RemoveFromWishlistRequest {
  adId: number;
}

export interface WishlistCountResponse {
  count: number;
}

export interface IsInWishlistResponse {
  isInWishlist: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private readonly baseUrl = `${environment.apiUrl}Wishlist`;

  private wishlist = new BehaviorSubject<WishlistResponse | null>(null);
  wishlist$ = this.wishlist.asObservable();

  constructor(
    private http: HttpClient,
    private toast: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Get user's wishlist items
   */
  getWishlist() {
    if (!isPlatformBrowser(this.platformId)) {
      return of({
        isSuccess: false,
        message: 'Not available on server',
        items: [],
        totalCount: 0,
      });
    }

    return this.http.get<WishlistResponse>(this.baseUrl).pipe(
      map((value) => {
        this.wishlist.next(value);
        return value;
      })
    );
  }

  /**
   * Add an item to user's wishlist
   */
  public addToWishlist(request: AddToWishlistRequest) {
    if (!isPlatformBrowser(this.platformId)) {
      return of({
        isSuccess: false,
        message: 'Not available on server',
        items: [],
        totalCount: 0,
      });
    }

    return this.http
      .post<WishlistResponse>(`${this.baseUrl}/add`, request)
      .pipe(
        map((value) => {
          const currentWishlist = this.wishlist.value;
          if (currentWishlist) {
            if (isPlatformBrowser(this.platformId)) {
              this.toast.success('تم الاضافة للمفضلة');
            }
            this.wishlist.next({
              ...currentWishlist,
              items: [...currentWishlist.items, ...value.items],
              totalCount: currentWishlist.totalCount + value.items.length,
            });
          } else {
            this.wishlist.next(value);
          }
          return value;
        })
      )
      .subscribe({
        error: () => {
          this.toast.error('تم الاضافة مسبقاً');
        },
      });
  }

  /**
   * Remove an item from user's wishlist
   */
  removeFromWishlist(
    request: RemoveFromWishlistRequest
  ): Observable<WishlistResponse> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({
        isSuccess: false,
        message: 'Not available on server',
        items: [],
        totalCount: 0,
      });
    }

    return this.http.post<WishlistResponse>(`${this.baseUrl}/remove`, request);
  }

  /**
   * Clear all items from user's wishlist
   */
  clearWishlist(): Observable<WishlistResponse> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({
        isSuccess: false,
        message: 'Not available on server',
        items: [],
        totalCount: 0,
      });
    }

    return this.http.post<WishlistResponse>(`${this.baseUrl}/clear`, {});
  }

  /**
   * Check if an item is in user's wishlist
   */
  isInWishlist(adId: number): Observable<IsInWishlistResponse> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({ isInWishlist: false });
    }

    return this.http.get<IsInWishlistResponse>(`${this.baseUrl}/check/${adId}`);
  }

  /**
   * Get wishlist count for user
   */
  getWishlistCount(): Observable<WishlistCountResponse> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({ count: 0 });
    }

    return this.http.get<WishlistCountResponse>(`${this.baseUrl}/count`);
  }

  /**
   * Toggle wishlist item (add if not present, remove if present)
   */
}
