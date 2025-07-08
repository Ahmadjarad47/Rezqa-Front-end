import { Component, inject, OnInit } from '@angular/core';
import { AdsService } from '../../service/ads.service';
import { Router } from '@angular/router';
import { SubCategoryDto, ISubCategoryPage } from '../../models/subCategory';
import { PaginatedRequest } from '../../models/Category';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-select-sub-category',
  standalone: false,
  templateUrl: './select-sub-category.component.html',
  styleUrl: './select-sub-category.component.css',
})
export class SelectSubCategoryComponent implements OnInit {
  adsService = inject(AdsService);
  router = inject(Router);

  isLoading: boolean = false;
  categoryId: number | undefined = 0;
  SubCategoryDto: SubCategoryDto[] = [];

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

  // Math property for template
  Math = Math;

  ngOnInit(): void {
    this.categoryId = this.adsService.getCurrentAds()?.categoryId;
    if (this.categoryId) {
      this.setupSearch();
      this.getSubCategory();
    } else {
      this.router.navigateByUrl('/ads');
    }
  }

  setupSearch() {
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.getSubCategory();
      });
  }

  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.searchSubject.next(this.searchTerm);
  }

  getSubCategory() {
    if (!this.categoryId) return;

    this.isLoading = true;

    const request: PaginatedRequest = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchTerm || undefined,
    };

    this.adsService.getSubCategoey(request, this.categoryId)?.subscribe({
      next: (response: ISubCategoryPage) => {
        this.SubCategoryDto = response.items;
        this.currentPage = response.pageNumber;
        this.pageSize = response.pageSize;
        this.totalCount = response.totalCount;
        this.totalPages = response.totalPages;
        this.hasPreviousPage = response.hasPreviousPage;
        this.hasNextPage = response.hasNextPage;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching sub-categories:', error);
        this.isLoading = false;
      },
    });
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.getSubCategory();
    }
  }

  onPageButtonClick(page: number | string) {
    if (typeof page === 'number') {
      this.onPageChange(page);
    }
  }

  onPageSizeChange(event: any) {
    this.pageSize = parseInt(event.target.value);
    this.currentPage = 1;
    this.getSubCategory();
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (this.currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }

      // Show last page
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
    }

    return pages;
  }

  selectSubCategory(subCategory: SubCategoryDto) {
    // Get current ads and update with sub-category
    const currentAd = this.adsService.getCurrentAds();
    if (currentAd) {
      currentAd.subCategoryId = subCategory.id;
      this.adsService.setCurrentAds(currentAd);

      // Fetch dynamic fields for the selected category and sub-category
      this.adsService.updateDynamicFields(
        currentAd.categoryId,
        currentAd.subCategoryId
      );

      // Navigate to next step
      this.router.navigateByUrl('/ads/select-details');
    }
  }
}
