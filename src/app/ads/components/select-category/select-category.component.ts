import { Component, inject, OnInit } from '@angular/core';
import { AdsService } from '../../service/ads.service';
import { IPage, ICategory, PaginatedRequest } from '../../models/Category';
import { CreateAdDto } from '../../models/Ads';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-select-category',
  standalone: false,
  templateUrl: './select-category.component.html',
  styleUrl: './select-category.component.css',
})
export class SelectCategoryComponent implements OnInit {
  adsService = inject(AdsService);
  router = inject(Router);

  categories: ICategory[] = [];
  loading = false;
  error: string | null = null;

  // Pagination properties
  currentPage = 1;
  pageSize = 1000; // جلب كل النتائج دفعة واحدة
  totalCount = 0;

  // Search properties
  searchTerm = '';
  private searchSubject = new Subject<string>();

  // Filter properties
  showActiveOnly = true;

  ngOnInit(): void {
    this.setupSearch();
    this.loadCategories();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;
        this.currentPage = 1; // Reset to first page when searching
        this.loadCategories();
      });
  }

  onSearchChange(event: any): void {
    const value = event.target.value;
    this.searchSubject.next(value);
  }

  getCategories(search?: string): Observable<IPage> {
    this.loading = true;
    this.error = null;

    const request: PaginatedRequest = {
      pageNumber: 1, // دائماً الصفحة الأولى
      pageSize: this.pageSize, // جلب كل النتائج دفعة واحدة
      search: search || this.searchTerm || undefined,
    };

    if (this.adsService.getCategoey) {
      const obs = this.adsService.getCategoey(request);
      if (obs) {
        return obs.pipe(
          tap((result) => {
            const page = result as IPage;
            this.categories = page.items;
            this.totalCount = page.totalCount;
            this.loading = false;
          }),
          catchError((error) => {
            this.error = 'Error loading categories';
            this.loading = false;
            console.error('Error loading categories:', error);
            return of({
              items: [],
              pageNumber: this.currentPage,
              pageSize: this.pageSize,
              totalCount: 0,
              totalPages: 0,
              hasPreviousPage: false,
              hasNextPage: false,
            });
          })
        );
      }
    }
    // Return empty result if service returns null (e.g., not in browser)
    return of({
      items: [],
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    });
  }

  loadCategories(search?: string): void {
    this.getCategories(search).subscribe({
      next: (response: IPage) => {
        this.categories = response.items;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load categories';
        this.loading = false;
        console.error('Error loading categories:', error);
      },
    });
  }

  // Pagination methods
  // تم حذف دوال التقسيم (pagination) لأنها لم تعد مطلوبة

  // Filter methods
  toggleActiveFilter(): void {
    this.showActiveOnly = !this.showActiveOnly;
    this.currentPage = 1;
    this.loadCategories();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.showActiveOnly = true;
    this.currentPage = 1;
    this.loadCategories();
  }

  // Utility methods
  getVisibleCategories(): ICategory[] {
    return this.categories;
  }

  getPageNumbers(): number[] {
    // لم يعد هناك تقسيم صفحات
    return [];
  }

  setCategoryIdAds(id: number) {
    const ad: CreateAdDto = {
      title: '',
      description: '',
      price: 0,
      location: '',
      fieldValues: [],
      DynamicFieldValues: [],
      categoryId: id,
      subCategoryId: 0,
      DynamicFields: [],
      imageUrl: null,
      isSpecific: false,
    };
    this.adsService.setCurrentAds(ad);
    this.router.navigateByUrl('/ads/select-sub-category');
  }
}
