import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdsService } from '../../services/ads.service';
import { PaginatedResult } from '@models/paginated-result.model';
import { AdDto } from '@models/ad.dto';
import { Ad } from '../../../models/ad.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-ads',
  standalone: false,
  templateUrl: './ads.component.html',
  styleUrl: './ads.component.css',
})
export class AdsComponent implements OnInit {
  Math = Math;
  ads: { items: Ad[], totalCount: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean } = {
    items: [],
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

  constructor(
    private adsService: AdsService,
    private fb: FormBuilder
  ) {
    this.updateForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadAds();
  }

  loadAds(): void {
    this.loading = true;
    this.error = null;

    this.adsService.getAds(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.ads = response;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load ads. Please try again.';
          this.loading = false;
          console.error('Error loading ads:', error);
        }
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadAds();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadAds();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadAds();
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
      isActive: ad.isActive
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
}
