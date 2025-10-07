import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef, NgZone, ApplicationRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
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


  // Theme properties
  isDarkMode = false;
  showThemeToggle = false;

  // Advanced UI properties
  showAdvancedFilters = false;
  viewMode: 'table' | 'grid' | 'cards' = 'table';
  isRefreshing = false;

  // Edit Modal properties
  showEditModal = false;
  showConfirmModal = false;
  editForm!: FormGroup;
  selectedFiles: File[] = [];
  fileValidationErrors: string[] = [];
  isSubmitting = false;
  editingAd: AdDto | null = null;
  isDragOver = false;
  filePreviewUrls: Map<File, string> = new Map();

  // Payment Modal properties
  showPaymentModal = false;
  paymentForm!: FormGroup;
  payingAd: AdDto | null = null;
  isProcessingPayment = false;
  
  // Premium ad pricing
  readonly PREMIUM_MONTHLY_PRICE = 5000; // 5000 SYP per month



  // Add Math property for template access
  Math = Math;



  private destroy$ = new Subject<void>();

  constructor(
    private adsService: DashboardAdsService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private appRef: ApplicationRef
  ) {
    // this.initializeTheme();
    this.initEditForm();
    this.initPaymentForm();
  }

  ngOnInit(): void {
    this.loadAds();
    this.setupThemeListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearFilePreviews();
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
          console.log(ads);
          
        },
        error: (error) => {
          console.error('Error loading ads:', error);
          this.error = 'فشل في تحميل الإعلانات. يرجى المحاولة مرة أخرى.';
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
          this.error = 'فشل في تحديث حالة الإعلان.';
        },
      });
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



  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'status-badge active' : 'status-badge inactive';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'نشط' : 'غير نشط';
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



  clearMessages(): void {
    this.error = '';
    this.successMessage = '';
  }

  // Edit Modal Methods
  private initEditForm(): void {
    this.editForm = this.fb.group({
      id: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      price: [0, [Validators.required, Validators.min(0)]],
      location: ['', [Validators.required, Validators.maxLength(100)]],
      phone: [''],
      isActive: [true]
    });
  }

  // Payment Modal Methods
  private initPaymentForm(): void {
    this.paymentForm = this.fb.group({
      activeMonths: [1, [Validators.required, Validators.min(1), Validators.max(12)]]
    });
  }

  editAd(ad: AdDto): void {
    this.editingAd = ad;
    this.selectedFiles = [];
    this.fileValidationErrors = [];
    this.isSubmitting = false;
    
    this.editForm.patchValue({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price,
      location: ad.location,
      phone: ad.phonNumber || '',
      isActive: ad.isActive
    });
    
    this.showEditModal = true;
    
    // Use Promise.resolve to avoid ExpressionChangedAfterItHasBeenCheckedError
    Promise.resolve().then(() => {
      this.cdr.markForCheck();
    });
  }

  closeEditModal(): void {
    // Check if there are unsaved changes
    const hasChanges = this.editForm.dirty || this.selectedFiles.length > 0;
    
    if (hasChanges && !this.isSubmitting) {
      this.showConfirmModal = true;
      return;
    }
    
    this.confirmClose();
  }

  confirmClose(): void {
    this.showEditModal = false;
    this.showConfirmModal = false;
    this.editingAd = null;
    this.clearFilePreviews();
    this.selectedFiles = [];
    this.fileValidationErrors = [];
    this.editForm.reset();
  }

  private clearFilePreviews(): void {
    // Revoke all blob URLs to free memory
    this.filePreviewUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.filePreviewUrls.clear();
  }

  cancelClose(): void {
    this.showConfirmModal = false;
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    this.processFiles(files);
    
    // Reset file input
    event.target.value = '';
  }

  removeFile(index: number): void {
    const file = this.selectedFiles[index];
    // Revoke the blob URL to free memory
    const url = this.filePreviewUrls.get(file);
    if (url) {
      URL.revokeObjectURL(url);
      this.filePreviewUrls.delete(file);
    }
    this.selectedFiles.splice(index, 1);
    this.fileValidationErrors = [];
    
    // Use requestAnimationFrame to avoid ExpressionChangedAfterItHasBeenCheckedError
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this.ngZone.run(() => {
          this.appRef.tick();
        });
      });
    });
  }

  getFilePreview(file: File): string {
    if (!this.filePreviewUrls.has(file)) {
      const url = URL.createObjectURL(file);
      this.filePreviewUrls.set(file, url);
    }
    return this.filePreviewUrls.get(file) || '';
  }

  getTotalFileSize(): string {
    const totalBytes = this.selectedFiles.reduce((sum, file) => sum + file.size, 0);
    return (totalBytes / 1024 / 1024).toFixed(2);
  }

  getFileSizePercentage(): number {
    const totalBytes = this.selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const maxBytes = 30 * 1024 * 1024; // 30MB
    return Math.min((totalBytes / maxBytes) * 100, 100);
  }

  trackByFile(index: number, file: File): string {
    return file.name + file.size + file.lastModified;
  }

  // Helper method to check if minimum images requirement is met
  canSubmitEdit(): boolean {
    return this.selectedFiles.length >= 3;
  }

  getImagesStatusMessage(): string {
    const count = this.selectedFiles.length;
    if (count >= 3) {
      return `تم رفع ${count} صور - يمكن التعديل الآن`;
    } else {
      return `تم رفع ${count} صور - مطلوب ${3 - count} صور إضافية للتمكن من التعديل`;
    }
  }

  // Drag and Drop Methods
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.processFiles(files);
    }
  }

  private processFiles(files: FileList): void {
    this.fileValidationErrors = [];
    
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (this.selectedFiles.length + files.length > 10) {
      this.fileValidationErrors.push('لا يمكن رفع أكثر من 10 صور');
      return;
    }

    // Note: Minimum 3 images requirement is checked only when submitting the form

    let totalSize = this.selectedFiles.reduce((sum, file) => sum + file.size, 0);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
        this.fileValidationErrors.push(`الملف ${file.name} ليس صورة صالحة`);
        continue;
      }
      
      // Check individual file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.fileValidationErrors.push(`الملف ${file.name} أكبر من 5 ميجابايت`);
        continue;
      }
      
      // Check total size (30MB)
      totalSize += file.size;
      if (totalSize > 30 * 1024 * 1024) {
        this.fileValidationErrors.push('المساحة الإجمالية للصور تتجاوز 30 ميجابايت');
        continue;
      }
      
      this.selectedFiles.push(file);
    }
    
    // Use requestAnimationFrame to avoid ExpressionChangedAfterItHasBeenCheckedError
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this.ngZone.run(() => {
          this.appRef.tick();
        });
      });
    });
  }

  onSubmitEdit(): void {
    if (this.editForm.invalid) {
      return;
    }

    // Check if user has uploaded at least 3 images
    if (this.selectedFiles.length < 3) {
      this.fileValidationErrors = ['يجب رفع على الأقل 3 صور قبل التعديل'];
      return;
    }

    this.isSubmitting = true;
    this.fileValidationErrors = [];

    // Prepare the update data object
    const updateData: any = {
      id: this.editForm.value.id,
      title: this.editForm.value.title,
      description: this.editForm.value.description,
      price: this.editForm.value.price,
      location: this.editForm.value.location,
      phone: this.editForm.value.phone,
      isActive: this.editForm.value.isActive
    };

    this.adsService.updateAd(this.editForm.value.id, updateData, this.selectedFiles)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = 'تم تحديث الإعلان بنجاح';
          this.closeEditModal();
          this.loadAds(); // Refresh the list
        },
        error: (error) => {
          console.error('Error updating ad:', error);
          this.error = 'فشل في تحديث الإعلان. يرجى المحاولة مرة أخرى.';
          this.isSubmitting = false;
        }
      });
  }

  // Payment Methods
  openPaymentModal(ad: AdDto): void {
    this.payingAd = ad;
    this.paymentForm.patchValue({
      activeMonths: ad.activeMonths || 1
    });
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.payingAd = null;
    this.paymentForm.reset();
    this.isProcessingPayment = false;
  }

  onSubmitPayment(): void {
    if (this.paymentForm.invalid || !this.payingAd) {
      return;
    }

    this.isProcessingPayment = true;
    const activeMonths = this.paymentForm.value.activeMonths;

    this.adsService.payForSpecificAd(this.payingAd.id, activeMonths)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response:any) => {
          debugger
          window.location.href = response.checkoutUrl;  
          this.successMessage = 'تم دفع الرسوم بنجاح! سيتم تفعيل الإعلان المميز.';
          this.closePaymentModal();
          this.loadAds(); // Refresh the list
        },
        error: (error) => {
          console.error('Error processing payment:', error);
          this.error = 'فشل في معالجة الدفع. يرجى المحاولة مرة أخرى.';
          this.isProcessingPayment = false;
        }
      });
  }

  // Helper methods for template
  canPayForAd(ad: AdDto): boolean {
    return ad.isSpecific && ad.isConfirmedByAdmin && !ad.isActive;
  }

  getAdStatusText(ad: AdDto): string {
    if (!ad.isSpecific) {
      return 'عادي';
    }
    if (!ad.isConfirmedByAdmin) {
      return 'في انتظار الموافقة';
    }
    if (ad.isActive) {
      return 'مميز - نشط';
    }
    return 'مميز - يحتاج دفع';
  }

  getAdStatusClass(ad: AdDto): string {
    if (!ad.isSpecific) {
      return 'normal';
    }
    if (!ad.isConfirmedByAdmin) {
      return 'pending';
    }
    if (ad.isActive) {
      return 'premium-active';
    }
    return 'premium-payment';
  }

  // Premium ad pricing methods
  getPremiumAdTotalPrice(months: number): number {
    return this.PREMIUM_MONTHLY_PRICE * months;
  }

  formatPremiumPrice(price: number): string {
    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  getCurrentPremiumPrice(): number {
    const months = this.paymentForm?.get('activeMonths')?.value || 1;
    return this.getPremiumAdTotalPrice(months);
  }
}
