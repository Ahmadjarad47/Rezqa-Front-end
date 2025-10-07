import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  Carousel,
  GetAllCarouselsRequest,
  PaginatedResult,
} from '../../models/carousel';
import { CarouselService } from '../../services/carousel.service';
import { CarouselFormComponent } from '../carousel-form/carousel-form.component';

@Component({
  selector: 'app-carousel',
  standalone: false,
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.css'
})
export class CarouselComponent implements OnInit {
  @ViewChild(CarouselFormComponent) carouselFormComponent!: CarouselFormComponent;
  
  carousels: Carousel[] = [];
  loading = false;
  error = '';
  success = '';
  showForm = false;
  editingCarousel: Carousel | null = null;

  // Delete modal properties
  showDeleteModal = false;
  deletingCarousel: Carousel | null = null;
  deleteLoading = false;

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  hasPreviousPage = false;
  hasNextPage = false;

  // Search and filter properties
  searchForm: FormGroup;
  searchTerm = '';
  isPagnationStop = false;

  // Math property for template
  Math = Math;

  constructor(
    private carouselService: CarouselService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      isPagnationStop: [false],
    });
  }

  ngOnInit(): void {
    this.loadCarousels();
    this.setupSearchListener();
  }

  get activeCarouselsCount(): number {
    return this.carousels.filter((c) => !c.isDeleted).length;
  }

  setupSearchListener(): void {
    this.searchForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((values) => {
        this.searchTerm = values.searchTerm;
        this.isPagnationStop = values.isPagnationStop;
        this.currentPage = 1; // Reset to first page when searching
        this.loadCarousels();
      });
  }

  loadCarousels(): void {
    this.loading = true;
    this.error = '';

    const request: GetAllCarouselsRequest = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined,
      isPagnationStop: this.isPagnationStop,
    };

    this.carouselService.getCarousels(request).subscribe({
      next: (result: PaginatedResult<Carousel>) => {
        this.carousels = result.items;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.hasPreviousPage = result.hasPreviousPage;
        this.hasNextPage = result.hasNextPage;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load carousels. Please try again.';
        this.loading = false;
        console.error('Error loading carousels:', error);
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCarousels();
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.pageSize = +target.value;
      this.currentPage = 1; // Reset to first page when changing page size
      this.loadCarousels();
    }
  }

  clearFilters(): void {
    this.searchForm.patchValue({
      searchTerm: '',
      isPagnationStop: false,
    });
  }

  addCarousel(): void {
    this.editingCarousel = null;
    this.showForm = true;
  }

  editCarousel(carousel: Carousel): void {
    this.editingCarousel = { ...carousel };
    this.showForm = true;
  }

  openDeleteModal(carousel: Carousel): void {
    this.deletingCarousel = carousel;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingCarousel = null;
    this.deleteLoading = false;
  }

  confirmDelete(): void {
    if (!this.deletingCarousel) return;

    this.deleteLoading = true;
    this.carouselService.deleteCarousel(this.deletingCarousel.id).subscribe({
      next: (success) => {
        if (success) {
          this.success = 'Carousel deleted successfully!';
          this.error = '';
          this.loadCarousels(); // Reload to refresh pagination
          this.closeDeleteModal();
          // Clear success message after 3 seconds
          this.deleteLoading = false;

          setTimeout(() => {
            this.success = '';
          }, 3000);
        } else {
          this.error = 'Failed to delete carousel. Please try again.';
          this.success = '';
          this.deleteLoading = false;
        }
      },
      error: (error) => {
        this.error = 'Failed to delete carousel. Please try again.';
        this.success = '';
        this.deleteLoading = false;
        console.error('Error deleting carousel:', error);
      },
    });
  }

  onFormSubmit(): void {
    if (!this.editingCarousel) {
      // Creating new carousel
      this.createNewCarousel();
    } else {
      // Updating existing carousel
      this.updateExistingCarousel();
    }
  }

  private createNewCarousel(): void {
    if (!this.carouselFormComponent) return;

    const formData = this.carouselFormComponent.getFormData();
    
    this.carouselService.createCarousel(formData).subscribe({
      next: (carouselId) => {
        console.log('Carousel created successfully with ID:', carouselId);
        this.success = 'Carousel created successfully!';
        this.error = '';
        this.showForm = false;
        this.editingCarousel = null;
        this.loadCarousels(); // Reload to refresh pagination
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error creating carousel:', error);
        this.error = 'Failed to create carousel. Please try again.';
        this.success = '';
        // Reset form submission state
        this.carouselFormComponent.isSubmitting = false;
      }
    });
  }

  private updateExistingCarousel(): void {
    if (!this.editingCarousel || !this.carouselFormComponent) return;

    const formData = this.carouselFormComponent.getFormData();
    
    this.carouselService.updateCarousel(this.editingCarousel.id, formData).subscribe({
      next: (success) => {
        if (success) {
          console.log('Carousel updated successfully');
          this.success = 'Carousel updated successfully!';
          this.error = '';
          this.showForm = false;
          this.editingCarousel = null;
          this.loadCarousels(); // Reload to refresh pagination
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.success = '';
          }, 3000);
        } else {
          this.error = 'Failed to update carousel. Please try again.';
          this.success = '';
          // Reset form submission state
          this.carouselFormComponent.isSubmitting = false;
        }
      },
      error: (error) => {
        console.error('Error updating carousel:', error);
        this.error = 'Failed to update carousel. Please try again.';
        this.success = '';
        // Reset form submission state
        this.carouselFormComponent.isSubmitting = false;
      }
    });
  }

  onFormCancel(): void {
    this.showForm = false;
    this.editingCarousel = null;
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      this.currentPage - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
