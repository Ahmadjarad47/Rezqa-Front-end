import { Component, OnInit } from '@angular/core';
import { AdsService } from '../../services/ads.service';
import { CategoryService } from '../../services/category.service';
import { SubCategoryService } from '../../services/subcategory.service';
import { PaginatedResult } from '../../../models/paginated-result.model';
import { AdDto } from '@models/ad.dto';
import { Ad } from '../../../models/ad.model';
import { Category } from '../../models/category';
import { SubCategoryDto } from '../../models/subcategory';
import { SearchParams } from '../../models/search-params.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-ads',
  standalone: false,
  templateUrl: './ads.component.html',
  styleUrl: './ads.component.css',
})
export class AdsComponent implements OnInit {
  Math = Math;
  ads: PaginatedResult<Ad> = {
    items: [],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  };

  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  loading: boolean = false;
  error: string | null = null;
  selectedImages: string[] = [];
  selectedFullImage: string = '';
  updateForm: FormGroup;
  selectedAd: Ad | null = null;
  adToDelete: number | null = null;

  // Search form properties
  searchForm: FormGroup;
  categories: Category[] = [];
  subCategories: SubCategoryDto[] = [];
  selectedCategoryId: number | null = null;
  selectedSubCategoryId: number | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  location: string = '';

  constructor(
    private adsService: AdsService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private fb: FormBuilder
  ) {
    this.updateForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
      isSpecific: [false],
      activeMonths: [null],
      isConfirmedByAdmin: [false]
    });

    this.searchForm = this.fb.group({
      searchTerm: [''],
      categoryId: [''],
      subCategoryId: [''],
      minPrice: [''],
      maxPrice: [''],
      location: ['']
    });
  }

  ngOnInit(): void {
    this.loadAds();
    this.loadCategories();
  }

  loadAds(): void {
    this.loading = true;
    this.error = null;

    // Use the new search endpoint if any search parameters are provided
    const hasSearchParams = this.searchTerm || this.selectedCategoryId || this.selectedSubCategoryId || 
                           this.minPrice || this.maxPrice || this.location;

    if (hasSearchParams) {
      const searchParams: SearchParams = {
        searchTerm: this.searchTerm || undefined,
        categoryId: this.selectedCategoryId || undefined,
        subCategoryId: this.selectedSubCategoryId || undefined,
        pageNumber: this.currentPage,
        pageSize: this.pageSize,
        minPrice: this.minPrice || undefined,
        maxPrice: this.maxPrice || undefined,
        location: this.location || undefined
      };

      this.adsService.searchAds(searchParams)
        .subscribe({
          next: (response) => {
            this.ads = response;
            console.log(this.ads);
            
            // Adjust current page if it's out of bounds
            if (this.currentPage > this.ads.totalPages && this.ads.totalPages > 0) {
              this.currentPage = this.ads.totalPages;
              // Reload with corrected page
              this.loadAds();
              return;
            }
            this.loading = false;
          },
          error: (error) => {
            this.error = 'Failed to search ads. Please try again.';
            this.loading = false;
            console.error('Error searching ads:', error);
          }
        });
    } else {
      // Use the original getAds method for basic listing
      this.adsService.getAds(this.currentPage, this.pageSize, this.searchTerm)
        .subscribe({
          next: (response) => {
            this.ads = response;
            // Adjust current page if it's out of bounds
            if (this.currentPage > this.ads.totalPages && this.ads.totalPages > 0) {
              this.currentPage = this.ads.totalPages;
              // Reload with corrected page
              this.loadAds();
              return;
            }
            this.loading = false;
          },
          error: (error) => {
            this.error = 'Failed to load ads. Please try again.';
            this.loading = false;
            console.error('Error loading ads:', error);
          }
        });
    }
  }

  loadCategories(): void {
    this.categoryService.getCategories({
      pageNumber: 1,
      pageSize: 1000, // Load all categories
      searchTerm: '',
      isActive: true
    }).subscribe({
      next: (response) => {
        this.categories = response.items;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onCategoryChange(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.selectedSubCategoryId = null; // Reset subcategory when category changes
    this.subCategories = [];
    
    // Update form control
    this.searchForm.patchValue({ subCategoryId: '' });
    
    if (categoryId) {
      this.loadSubCategories(categoryId);
    }
    
    this.currentPage = 1;
    this.loadAds();
  }

  loadSubCategories(categoryId: number): void {
    this.subCategoryService.getSubCategoriesByCategory(categoryId, {
      pageNumber: 1,
      pageSize: 1000, // Load all subcategories
      searchTerm: '',
      categoryId: categoryId
    }).subscribe({
      next: (response) => {
        this.subCategories = response.items;
      },
      error: (error) => {
        console.error('Error loading subcategories:', error);
      }
    });
  }

  onSubCategoryChange(subCategoryId: number | null): void {
    this.selectedSubCategoryId = subCategoryId;
    this.currentPage = 1;
    this.loadAds();
  }

  onPriceRangeChange(): void {
    // Update form values from the model
    this.searchForm.patchValue({
      minPrice: this.minPrice,
      maxPrice: this.maxPrice
    });
    this.currentPage = 1;
    this.loadAds();
  }

  onLocationChange(): void {
    // Update form values from the model
    this.searchForm.patchValue({ location: this.location });
    this.currentPage = 1;
    this.loadAds();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadAds();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = null;
    this.selectedSubCategoryId = null;
    this.minPrice = null;
    this.maxPrice = null;
    this.location = '';
    this.subCategories = [];
    
    this.searchForm.reset();
    this.currentPage = 1;
    this.loadAds();
  }

  onCategorySelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.onCategoryChange(value ? +value : null);
  }

  onSubCategorySelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.onSubCategoryChange(value ? +value : null);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.ads.totalPages) {
      this.currentPage = page;
      this.loadAds();
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize = parseInt(target.value, 10);
    this.currentPage = 1;
    this.loadAds();
  }

  getPageNumbers(): number[] {
    const totalPages = this.ads.totalPages;
    const currentPage = this.currentPage;
    const pages: number[] = [];
    
    // Return empty array if no pages
    if (totalPages <= 0) {
      return pages;
    }
    
    // Show max 5 pages around current page
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  openImageModal(images: string[]): void {
    this.selectedImages = images;
    const modal = document.getElementById('imageModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  closeImageModal(): void {
    const modal = document.getElementById('imageModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    this.selectedImages = [];
  }

  openFullImage(image: string): void {
    this.selectedFullImage = image;
    const modal = document.getElementById('fullImageModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  closeFullImage(): void {
    const modal = document.getElementById('fullImageModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    this.selectedFullImage = '';
  }

  openUpdateModal(ad: Ad): void {
    this.selectedAd = ad;
    this.updateForm.patchValue({
      title: ad.title,
      description: ad.description,
      price: ad.price,
      isActive: ad.isActive,
      isSpecific: ad.isSpecific,
      activeMonths: ad.activeMonths,
      isConfirmedByAdmin: ad.isConfirmedByAdmin
    });
    const modal = document.getElementById('updateAdModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  closeUpdateModal(): void {
    const modal = document.getElementById('updateAdModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    this.selectedAd = null;
    this.updateForm.reset();
  }

  toggleAdStatus(ad: Ad): void {
    this.adsService.toggleAdStatus(ad.id).subscribe({
      next: () => {
        this.loadAds();
      },
      error: (error) => {
        this.error = 'Failed to update ad status. Please try again.';
        console.error('Error updating ad status:', error);
      }
    });
  }

  deleteAd(id: number): void {
    this.adToDelete = id;
    const modal = document.getElementById('deleteConfirmationModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  closeDeleteModal(): void {
    const modal = document.getElementById('deleteConfirmationModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    this.adToDelete = null;
  }

  confirmDelete(): void {
    if (this.adToDelete) {
      this.adsService.deleteAd(this.adToDelete).subscribe({
        next: () => {
          this.loadAds();
          this.closeDeleteModal();
        },
        error: (error) => {
          this.error = 'Failed to delete ad. Please try again.';
          console.error('Error deleting ad:', error);
          this.closeDeleteModal();
        }
      });
    }
  }

  onUpdate(): void {
    if (this.updateForm.valid && this.selectedAd) {
      const formValue = this.updateForm.value;
      const updatedAd: Ad = {
        ...this.selectedAd,
        title: formValue.title,
        description: formValue.description,
        price: formValue.price,
        isActive: formValue.isActive,
        isSpecific: formValue.isSpecific,
        activeMonths: formValue.activeMonths,
        isConfirmedByAdmin: formValue.isConfirmedByAdmin
      };

      this.adsService.updateAd(updatedAd).subscribe({
        next: () => {
          this.loadAds();
          this.closeUpdateModal();
        },
        error: (error) => {
          this.error = 'Failed to update ad. Please try again.';
          console.error('Error updating ad:', error);
        }
      });
    }
  }

  confirmAd(ad: Ad): void {
    this.adsService.confirmAd(ad.id).subscribe({
      next: () => {
        this.loadAds();
      },
      error: (error) => {
        this.error = 'Failed to confirm ad. Please try again.';
        console.error('Error confirming ad:', error);
      }
    });
  }

  unconfirmAd(ad: Ad): void {
    this.adsService.unconfirmAd(ad.id).subscribe({
      next: () => {
        this.loadAds();
      },
      error: (error) => {
        this.error = 'Failed to unconfirm ad. Please try again.';
        console.error('Error unconfirming ad:', error);
      }
    });
  }
}
