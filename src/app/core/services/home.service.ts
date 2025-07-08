import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '@environments/environment.development';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { TransferState, makeStateKey } from '@angular/core';

export interface CategoryDto {
  id: number;
  title: string;
  image?: string;
  description: string;
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
  private apiUrl = environment.apiUrl + 'Home'; // عدل الرابط حسب عنوان الـ API لديك
  private saveCategorySource = new BehaviorSubject<CategoryDto | null>(null);
  private categoryKey = makeStateKey<CategoryDto | null>('categoryKey');

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private transferState: TransferState
  ) {}

  getCategories(
    pageNumber = 1,
    pageSize = 6
  ): Observable<PaginatedResult<CategoryDto>> {
    let params = new HttpParams()
      .set('PageNumber', pageNumber)
      .set('PageSize', pageSize);

    return this.http.get<PaginatedResult<CategoryDto>>(this.apiUrl, { params });
  }

  setCategory(category: CategoryDto | null): void {
    if (isPlatformBrowser(this.platformId)) {
      // Client-side
      sessionStorage.setItem('selectedCategory', JSON.stringify(category));
    }
    // For both client and server, update the BehaviorSubject
    this.saveCategorySource.next(category);

    // On the server, set the value for transfer
    if (!isPlatformBrowser(this.platformId)) {
      this.transferState.set(this.categoryKey, category);
    }
  }

  getCategory(): CategoryDto | null {
    // First, check TransferState on the client
    if (isPlatformBrowser(this.platformId)) {
      if (this.transferState.hasKey(this.categoryKey)) {
        const category = this.transferState.get(this.categoryKey, null);
        this.transferState.remove(this.categoryKey); // Clean up the state
        sessionStorage.setItem('selectedCategory', JSON.stringify(category));
        this.saveCategorySource.next(category);
        return category;
      }

      // Then, check sessionStorage
      const categoryStr = sessionStorage.getItem('selectedCategory');
      if (categoryStr) {
        const category = JSON.parse(categoryStr);
        this.saveCategorySource.next(category);
        return category;
      }
    }

    // Finally, return the value from the BehaviorSubject
    return this.saveCategorySource.value;
  }
}
