import { Component, inject, OnInit } from '@angular/core';
import { AdsService } from '../../service/ads.service';
import { IPage, ICategory, PaginatedRequest } from '../../models/Category';
import { Observable, of } from 'rxjs';
import { CreateAdDto } from '../../models/Ads';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

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
  pageSize = 10;
  totalPages = 0;
  totalCount = 0;
  hasNextPage = false;
  hasPreviousPage = false;

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
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchTerm || search,
    };

    const result = this.adsService.getCategoey(request);
    if (result) {
      return result;
    } else {
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
  }

  loadCategories(search?: string): void {
    this.getCategories(search).subscribe({
      next: (response: IPage) => {
        this.categories = response.items;
        this.currentPage = response.pageNumber;
        this.pageSize = response.pageSize;
        this.totalCount = response.totalCount;
        this.totalPages = response.totalPages;
        this.hasNextPage = response.hasNextPage;
        this.hasPreviousPage = response.hasPreviousPage;
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
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadCategories();
    }
  }

  goToNextPage(): void {
    if (this.hasNextPage) {
      this.goToPage(this.currentPage + 1);
    }
  }

  goToPreviousPage(): void {
    if (this.hasPreviousPage) {
      this.goToPage(this.currentPage - 1);
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages);
  }

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
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, start + maxVisiblePages - 1);

      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
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
    };
    this.adsService.setCurrentAds(ad);
    this.router.navigateByUrl('/ads/select-sub-category');
  }
}
