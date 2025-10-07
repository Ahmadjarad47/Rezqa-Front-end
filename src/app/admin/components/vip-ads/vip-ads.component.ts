import { Component, OnInit } from '@angular/core';
import { VipAdsService } from '../../services/vip-ads.service';
import { PaginatedResult } from '../../../models/paginated-result.model';
import { VipAdsDto, CreateVipAdsDto, UpdateVipAdsDto, GetAllVipAdsQuery } from '../../models/vip-ads.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-vip-ads',
  standalone: false,
  templateUrl: './vip-ads.component.html',
  styleUrl: './vip-ads.component.css'
})
export class VipAdsComponent implements OnInit {
  Math = Math;
  vipAds: PaginatedResult<VipAdsDto> = {
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
  vipAdToDelete: number | null = null;

  // Search form properties
  searchForm: FormGroup;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  location: string = '';

  // Create/Update form properties
  createForm: FormGroup;
  updateForm: FormGroup;
  selectedVipAd: VipAdsDto | null = null;
  selectedFiles: FileList | null = null;
  selectedUpdateFiles: FileList | null = null;
  imagesToDelete: string[] = [];

  constructor(
    private vipAdsService: VipAdsService,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      price: [0, [Validators.required, Validators.min(0)]],
      phonNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/), Validators.minLength(10), Validators.maxLength(20)]],
      adsInfo: ['']
    });

    this.updateForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      price: [0, [Validators.required, Validators.min(0)]],
      phonNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/), Validators.minLength(10), Validators.maxLength(20)]],
      adsInfo: ['']
    });

    this.searchForm = this.fb.group({
      searchTerm: [''],
      minPrice: [''],
      maxPrice: [''],
      location: ['']
    });
  }

  ngOnInit(): void {
    this.loadVipAds();
  }

  loadVipAds(): void {
    this.loading = true;
    this.error = null;

    const query: GetAllVipAdsQuery = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined,
      minPrice: this.minPrice || undefined,
      maxPrice: this.maxPrice || undefined,
      location: this.location || undefined
    };

    this.vipAdsService.getAllVipAds(query)
      .subscribe({
        next: (response) => {
          this.vipAds = response;
          
          // Adjust current page if it's out of bounds
          if (this.currentPage > this.vipAds.totalPages && this.vipAds.totalPages > 0) {
            this.currentPage = this.vipAds.totalPages;
            this.loadVipAds();
            return;
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load VIP ads. Please try again.';
          this.loading = false;
          console.error('Error loading VIP ads:', error);
        }
      });
  }

  onPriceRangeChange(): void {
    this.searchForm.patchValue({
      minPrice: this.minPrice,
      maxPrice: this.maxPrice
    });
    this.currentPage = 1;
    this.loadVipAds();
  }

  onLocationChange(): void {
    this.searchForm.patchValue({ location: this.location });
    this.currentPage = 1;
    this.loadVipAds();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadVipAds();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.location = '';
    
    this.searchForm.reset();
    this.currentPage = 1;
    this.loadVipAds();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.vipAds.totalPages) {
      this.currentPage = page;
      this.loadVipAds();
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize = parseInt(target.value, 10);
    this.currentPage = 1;
    this.loadVipAds();
  }

  getPageNumbers(): number[] {
    const totalPages = this.vipAds.totalPages;
    const currentPage = this.currentPage;
    const pages: number[] = [];
    
    if (totalPages <= 0) {
      return pages;
    }
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
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

  openCreateModal(): void {
    this.createForm.reset();
    this.selectedFiles = null;
    const modal = document.getElementById('createVipAdModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  closeCreateModal(): void {
    const modal = document.getElementById('createVipAdModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    this.createForm.reset();
    this.selectedFiles = null;
  }

  openUpdateModal(vipAd: VipAdsDto): void {
    this.selectedVipAd = vipAd;
    this.imagesToDelete = [];
    this.selectedUpdateFiles = null;
    
    this.updateForm.patchValue({
      title: vipAd.title,
      description: vipAd.description,
      price: vipAd.price,
      phonNumber: vipAd.phonNumber,
      adsInfo: JSON.stringify(vipAd.adsInfo, null, 2)
    });
    
    const modal = document.getElementById('updateVipAdModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  closeUpdateModal(): void {
    const modal = document.getElementById('updateVipAdModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    this.selectedVipAd = null;
    this.updateForm.reset();
    this.imagesToDelete = [];
    this.selectedUpdateFiles = null;
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedFiles = target.files;
  }

  onUpdateFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedUpdateFiles = target.files;
  }

  markImageForDeletion(image: string): void {
    if (!this.imagesToDelete.includes(image)) {
      this.imagesToDelete.push(image);
    }
  }

  unmarkImageForDeletion(image: string): void {
    this.imagesToDelete = this.imagesToDelete.filter(img => img !== image);
  }

  onCreate(): void {
    if (this.createForm.valid) {
      const formValue = this.createForm.value;
      const createDto: CreateVipAdsDto = {
        title: formValue.title,
        description: formValue.description,
        price: formValue.price,
        phonNumber: formValue.phonNumber,
        image: [],
        images: this.selectedFiles || new FileList(),
        adsInfo: formValue.adsInfo ? JSON.parse(formValue.adsInfo) : {}
      };

      this.vipAdsService.createVipAd(createDto).subscribe({
        next: () => {
          this.loadVipAds();
          this.closeCreateModal();
        },
        error: (error) => {
          this.error = 'Failed to create VIP ad. Please try again.';
          console.error('Error creating VIP ad:', error);
        }
      });
    }
  }

  onUpdate(): void {
    if (this.updateForm.valid && this.selectedVipAd) {
      const formValue = this.updateForm.value;
      const updateDto: UpdateVipAdsDto = {
        id: this.selectedVipAd.id,
        title: formValue.title,
        description: formValue.description,
        price: formValue.price,
        phonNumber: formValue.phonNumber,
        image: this.selectedVipAd.image,
        imageWantDelete: this.imagesToDelete,
        images: this.selectedUpdateFiles || undefined,
        adsInfo: formValue.adsInfo ? JSON.parse(formValue.adsInfo) : {}
      };

      this.vipAdsService.updateVipAd(this.selectedVipAd.id, updateDto).subscribe({
        next: () => {
          this.loadVipAds();
          this.closeUpdateModal();
        },
        error: (error) => {
          this.error = 'Failed to update VIP ad. Please try again.';
          console.error('Error updating VIP ad:', error);
        }
      });
    }
  }

  deleteVipAd(id: number): void {
    this.vipAdToDelete = id;
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
    this.vipAdToDelete = null;
  }

  confirmDelete(): void {
    if (this.vipAdToDelete) {
      this.vipAdsService.deleteVipAd(this.vipAdToDelete).subscribe({
        next: () => {
          this.loadVipAds();
          this.closeDeleteModal();
        },
        error: (error) => {
          this.error = 'Failed to delete VIP ad. Please try again.';
          console.error('Error deleting VIP ad:', error);
          this.closeDeleteModal();
        }
      });
    }
  }
}
