import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AdsService } from '../../service/ads.service';
import { ToastrService } from 'ngx-toastr';

interface UploadBox {
  id: number;
  file: File | null;
  preview: string | null;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

@Component({
  selector: 'app-upload-photo',
  standalone: false,
  templateUrl: './upload-photo.component.html',
  styleUrl: './upload-photo.component.css',
})
export class UploadPhotoComponent implements OnInit {
  router = inject(Router);
  adsService = inject(AdsService);
  toastr = inject(ToastrService);
  uploadBoxes: UploadBox[] = [];
  isDragging = false;
  maxFiles = 10;
  maxTotalSize = 30 * 1024 * 1024; // 30MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // Loading states
  isSaving = false;
  saveError: string | null = null;

  ngOnInit() {
    this.initializeUploadBoxes();
    const categoryId = this.adsService.getCurrentAds()?.categoryId;
    const SubcategoryId = this.adsService.getCurrentAds()?.subCategoryId;
    const dy = this.adsService.getCurrentAds()?.DynamicFieldValues;
    if (!categoryId || !SubcategoryId || !dy) {
      this.router.navigateByUrl('/ads');
    }
  }

  initializeUploadBoxes() {
    this.uploadBoxes = [];
    for (let i = 0; i < this.maxFiles; i++) {
      this.uploadBoxes.push({
        id: i + 1,
        file: null,
        preview: null,
        isUploading: false,
        uploadProgress: 0,
        error: null,
      });
    }
  }

  onFileSelected(event: Event, boxId: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.processFile(file, boxId);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent, boxId: number) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.processFile(file, boxId);
    }
  }

  processFile(file: File, boxId: number) {
    const box = this.uploadBoxes.find((b) => b.id === boxId);
    if (!box) return;

    // Reset box state
    box.error = null;
    box.uploadProgress = 0;

    // Validate file type
    if (!this.allowedTypes.includes(file.type)) {
      box.error =
        'نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG, PNG أو WebP';
      return;
    }

    // Validate total file size
    const currentTotalSize = this.getUploadedFiles().reduce(
      (sum, f) => sum + f.size,
      0
    );
    if (currentTotalSize + file.size > this.maxTotalSize) {
      box.error = 'تجاوز الحد الإجمالي لحجم الصور (30 ميجابايت)';
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      box.file = file;
      box.preview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeFile(boxId: number) {
    const box = this.uploadBoxes.find((b) => b.id === boxId);
    if (box) {
      box.file = null;
      box.preview = null;
      box.error = null;
      box.uploadProgress = 0;
    }
  }

  getUploadedFiles(): File[] {
    return this.uploadBoxes
      .filter((box) => box.file !== null)
      .map((box) => box.file!)
      .filter((file) => file !== null);
  }

  getUploadedCount(): number {
    return this.getUploadedFiles().length;
  }

  getTotalSize(): string {
    const files = this.getUploadedFiles();
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    return this.formatFileSize(totalBytes);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isBoxEmpty(box: UploadBox): boolean {
    return box.file === null && box.preview === null;
  }

  hasUploadedFiles(): boolean {
    return this.getUploadedCount() > 2;
  }

  savePhotos() {
    if (!this.hasUploadedFiles()) {
      this.saveError = 'يرجى رفع صورة 3 على الأقل';
      return;
    }

    this.isSaving = true;
    this.saveError = null;

    // Simulate upload process
    setTimeout(() => {
      const files = this.getUploadedFiles();

      // Get current ad data and log it for debugging
      const currentAd = this.adsService.getCurrentAds();
      console.log('Current ad data before saving:', currentAd);

      // Save files to service
      this.adsService.setCurrentAds({
        ...this.adsService.getCurrentAds()!,
        imageUrl: files as any, // Convert File[] to FileList-like object
      });

      this.isSaving = false;
      console.log('Final ad data to submit:', this.adsService.getCurrentAds());
      this.adsService.submitAd(this.adsService.getCurrentAds()!).subscribe({
        next: (res) => {
          this.toastr.success('تم الانشاء بنجاح', 'اعلانك قيد التحقق ');
          this.router.navigateByUrl("/")
        },
        error: (err) => {
          console.log(err);
        },
      });
      // Navigate to next step or show success
      // this.router.navigate(['/ads/select-category']); // You can change this to the next step
    }, 2000);
  }

  // Get next empty box
  getNextEmptyBox(): UploadBox | undefined {
    return this.uploadBoxes.find((box) => this.isBoxEmpty(box));
  }

  // Auto-fill next empty box when file is dropped
  autoFillNextBox(file: File) {
    const nextEmptyBox = this.getNextEmptyBox();
    if (nextEmptyBox) {
      this.processFile(file, nextEmptyBox.id);
    }
  }
}
