import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize, forkJoin } from 'rxjs';
import { AdDto } from '../../../models/ad.dto';
import { DashboardAdsService } from './ads.service';

@Component({
  selector: 'app-ads',
  standalone: false,
  templateUrl: './ads.component.html',
  styleUrl: './ads.component.css',
})
export class AdsComponent implements OnInit, OnDestroy {
  ads: AdDto[] = [];
  filteredAds: AdDto[] = [];
  loading = false;
  error = '';
  successMessage = '';
  searchTerm = '';
  categoryTitle: string = '';
  statusFilter = 'all';
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  selectedAds: number[] = [];
  showDeleteConfirm = false;
  adToDelete: number | null = null;
  isDeleting = false;

  // Theme properties
  isDarkMode = false;
  showThemeToggle = false;

  // Advanced UI properties
  showAdvancedFilters = false;
  viewMode: 'table' | 'grid' | 'cards' = 'table';
  showBulkActions = false;
  isRefreshing = false;

  // Update Modal properties
  showUpdateModal = false;
  updateForm!: FormGroup;
  adToUpdate: AdDto | null = null;
  isUpdating = false;
  updateError = '';
  selectedFiles: File[] = [];
  imagePreviewUrls: string[] = [];

  // Add Math property for template access
  Math = Math;

  private destroy$ = new Subject<void>();

  constructor(
    private adsService: DashboardAdsService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.initializeTheme();
    this.initializeUpdateForm();
  }

  ngOnInit(): void {
    this.loadAds();
    this.setupThemeListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:storage', ['$event'])
  onStorageChange(event: StorageEvent) {
    if (event.key === 'theme') {
      this.updateTheme();
    }
  }

  private initializeTheme(): void {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        this.isDarkMode = savedTheme === 'dark';
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.isDarkMode = true;
      }
      this.updateTheme();
    }
  }

  private setupThemeListener(): void {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (!localStorage.getItem('theme')) {
          this.isDarkMode = mediaQuery.matches;
          this.updateTheme();
        }
      });
    }
  }

  private updateTheme(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.updateTheme();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  toggleViewMode(mode: 'table' | 'grid' | 'cards'): void {
    this.viewMode = mode;
  }

  refreshAds(): void {
    this.isRefreshing = true;
    this.loadAds();
  }

  loadAds(): void {
    this.loading = true;
    this.clearMessages();

    this.adsService
      .getUserAds()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.isRefreshing = false;
        })
      )
      .subscribe({
        next: (ads) => {
          this.ads = ads;
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error loading ads:', error);
          this.error = 'Failed to load ads. Please try again.';
        },
      });
  }

  applyFilters(): void {
    let filtered = [...this.ads];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ad) =>
          ad.title.toLowerCase().includes(search) ||
          ad.description.toLowerCase().includes(search) ||
          ad.categoryTitle.toLowerCase().includes(search) ||
          ad.location.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter((ad) => ad.isActive === isActive);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (this.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'category':
          aValue = a.categoryTitle.toLowerCase();
          bValue = b.categoryTitle.toLowerCase();
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredAds = filtered;
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAds.length / this.itemsPerPage);
  }

  get paginatedAds(): AdDto[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAds.slice(startIndex, endIndex);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onSelectAll(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedAds = this.paginatedAds.map((ad) => ad.id);
    } else {
      this.selectedAds = [];
    }
  }

  onSelectAd(adId: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedAds.push(adId);
    } else {
      this.selectedAds = this.selectedAds.filter((id) => id !== adId);
    }
  }

  isSelected(adId: number): boolean {
    return this.selectedAds.includes(adId);
  }

  toggleAdStatus(ad: AdDto): void {
    this.adsService
      .updateActiveStatus(ad.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          ad.isActive = !ad.isActive;
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error updating ad status:', error);
          this.error = 'Failed to update ad status.';
        },
      });
  }

  editAd(ad: AdDto): void {
    this.openUpdateModal(ad);
  }

  viewAd(ad: AdDto): void {
    // Open ad details in a new tab
    const url =
      '/all/' +
      ad.categoryTitle.replaceAll(' ', '-') +
      '/' +
      ad.title.replaceAll(' ', '-') +
      '/' +
      ad.id;
    window.open(url, '_blank');
  }

  confirmDelete(adId: number): void {
    this.adToDelete = adId;
    this.showDeleteConfirm = true;
  }

  deleteAd(): void {
    if (!this.adToDelete) return;

    this.clearMessages();
    this.isDeleting = true;

    this.adsService
      .deleteAd(this.adToDelete)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isDeleting = false))
      )
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            // Remove the ad from the local array
            this.ads = this.ads.filter((ad) => ad.id !== this.adToDelete);
            this.selectedAds = this.selectedAds.filter(
              (id) => id !== this.adToDelete
            );
            this.applyFilters();
            this.showDeleteConfirm = false;
            this.adToDelete = null;
            this.successMessage =
              response.message || 'Ad deleted successfully!';
            // Auto-clear success message after 3 seconds
            setTimeout(() => (this.successMessage = ''), 3000);
            console.log('Ad deleted successfully:', response.message);
          } else {
            // Handle API error response
            this.error = response.message || 'Failed to delete ad.';
            this.showDeleteConfirm = false;
            this.adToDelete = null;
          }
        },
        error: (error) => {
          console.error('Error deleting ad:', error);
          // Handle HTTP errors (404, 403, 500, etc.)
          if (error.status === 404) {
            this.error = 'Ad not found or already deleted.';
          } else if (error.status === 403) {
            this.error = 'You are not authorized to delete this ad.';
          } else if (error.status === 500) {
            this.error = 'Server error occurred while deleting the ad.';
          } else {
            this.error =
              error.error?.message || error.message || 'Failed to delete ad.';
          }
          this.showDeleteConfirm = false;
          this.adToDelete = null;
        },
      });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.adToDelete = null;
    this.isDeleting = false;
  }

  deleteSelectedAds(): void {
    if (this.selectedAds.length === 0) return;

    this.clearMessages();

    const deleteObservables = this.selectedAds.map((adId) =>
      this.adsService.deleteAd(adId)
    );

    // Use forkJoin for multiple HTTP requests
    forkJoin(deleteObservables)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses) => {
          // Check if all deletions were successful
          const failedDeletions = responses.filter(
            (response) => !response.isSuccess
          );

          if (failedDeletions.length === 0) {
            // All deletions successful
            this.ads = this.ads.filter(
              (ad) => !this.selectedAds.includes(ad.id)
            );
            this.selectedAds = [];
            this.applyFilters();
            this.successMessage = `All ${responses.length} selected ads deleted successfully!`;
            // Auto-clear success message after 3 seconds
            setTimeout(() => (this.successMessage = ''), 3000);
            console.log('All selected ads deleted successfully');
          } else {
            // Some deletions failed
            const failedIds = failedDeletions.map(
              (_, index) => this.selectedAds[index]
            );
            this.ads = this.ads.filter((ad) => !failedIds.includes(ad.id));
            this.selectedAds = this.selectedAds.filter(
              (id) => !failedIds.includes(id)
            );
            this.applyFilters();

            const errorMessages = failedDeletions
              .map((response) => response.message)
              .join(', ');
            this.error = `Some ads could not be deleted: ${errorMessages}`;
          }
        },
        error: (error) => {
          console.error('Error deleting selected ads:', error);
          if (error.status === 403) {
            this.error =
              'You are not authorized to delete some of the selected ads.';
          } else if (error.status === 500) {
            this.error = 'Server error occurred while deleting ads.';
          } else {
            this.error =
              error.error?.message ||
              error.message ||
              'Failed to delete selected ads.';
          }
        },
      });
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'status-badge active' : 'status-badge inactive';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getImageUrl(ad: AdDto): string {
    return ad.imageUrl && ad.imageUrl.length > 0
      ? ad.imageUrl[0]
      : 'assets/images/placeholder.jpg';
  }

  hasMultipleImages(ad: AdDto): boolean {
    return !!ad.imageUrl && ad.imageUrl.length > 1;
  }

  getImageCount(ad: AdDto): number {
    return ad.imageUrl ? ad.imageUrl.length : 0;
  }

  initializeUpdateForm(): void {
    this.updateForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(200),
        ],
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(2000),
        ],
      ],
      price: [0, [Validators.required, Validators.min(0)]],
      location: ['', [Validators.required, Validators.maxLength(100)]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]+$/)],
      ],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  openUpdateModal(ad: AdDto): void {
    this.adToUpdate = { ...ad };
    this.showUpdateModal = true;
    this.updateError = '';
    this.selectedFiles = [];
    this.imagePreviewUrls = ad.imageUrl || [];

    this.updateForm.patchValue({
      title: ad.title,
      description: ad.description,
      price: ad.price,
      location: ad.location,
      phone: ad.phonNumber,
      email: ad.userName, // Assuming email is stored in userName field
    });
  }

  closeUpdateModal(): void {
    this.showUpdateModal = false;
    this.adToUpdate = null;
    this.updateError = '';
    this.selectedFiles = [];
    this.imagePreviewUrls = [];
    this.updateForm.reset();
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          this.selectedFiles.push(file);
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.imagePreviewUrls.push(e.target.result);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }

  removeImage(index: number): void {
    this.imagePreviewUrls.splice(index, 1);
    if (index < this.selectedFiles.length) {
      this.selectedFiles.splice(index, 1);
    }
  }

  updateAd(): void {
    if (this.updateForm.invalid || !this.adToUpdate) {
      return;
    }

    this.isUpdating = true;
    this.updateError = '';

    let formData = new FormData();
    formData.append('Id', this.adToUpdate.id.toString());
    formData.append('Title', this.updateForm.get('title')?.value);
    formData.append('Description', this.updateForm.get('description')?.value);
    formData.append('Location', this.updateForm.get('location')?.value);
    formData.append('Price', this.updateForm.get('price')?.value.toString());
    formData.append('Phone', this.updateForm.get('phone')?.value);
    formData.append('Email', this.updateForm.get('email')?.value);

    // Handle dynamic field values if they exist
    if (this.adToUpdate.adFieldDtos && this.adToUpdate.adFieldDtos.length > 0) {
      console.log(
        'DynamicFieldValues before conversion:',
        this.adToUpdate.adFieldDtos
      );

      this.adToUpdate.adFieldDtos.forEach((field, index) => {
        formData.append(
          `fieldValues[${index}].dynamicFieldId`,
          field.dynamicFieldId.toString()
        );
        formData.append(`fieldValues[${index}].value`, field.value || '');
      });
    } else {
      console.log('No DynamicFieldValues found, sending empty array');
      // Send an empty field value to ensure the array is initialized
      formData.append('fieldValues[0].dynamicFieldId', '0');
      formData.append('fieldValues[0].value', '');
    }

    // Handle image files
    if (this.selectedFiles.length > 0) {
      for (let i = 0; i < this.selectedFiles.length; i++) {
        formData.append('ImageUrl', this.selectedFiles[i]);
      }
    }

    // Log the final FormData contents
    console.log('FormData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    this.adsService
      .updateAd(this.adToUpdate.id, formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isUpdating = false))
      )
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            // Update the ad in the local array
            const updatedAd = {
              ...this.adToUpdate!,
              title: this.updateForm.get('title')?.value,
              description: this.updateForm.get('description')?.value,
              price: this.updateForm.get('price')?.value,
              location: this.updateForm.get('location')?.value,
              phonNumber: this.updateForm.get('phone')?.value,
              userName: this.updateForm.get('email')?.value,
            };
            this.ads = this.ads.map((ad) =>
              ad.id === this.adToUpdate?.id ? updatedAd : ad
            );
            this.applyFilters();
            this.closeUpdateModal();
          } else {
            this.updateError = response.message || 'Failed to update ad.';
          }
        },
        error: (error: any) => {
          console.error('Error updating ad:', error);
          this.updateError =
            error.error?.message ||
            error.message ||
            'Failed to update ad. Please try again.';
        },
      });
  }

  clearMessages(): void {
    this.error = '';
    this.successMessage = '';
  }
}
