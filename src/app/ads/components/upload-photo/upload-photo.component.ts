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
  maxFileSize = 5 * 1024 * 1024; // 5MB per file
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // Loading states
  isSaving = false;
  saveError: string | null = null;
  isSubmitting = false; // New loading state for complete submission
  submissionProgress = 0; // Progress tracking

  ngOnInit() {
    this.initializeUploadBoxes();
    const categoryId = this.adsService.getCurrentAds()?.categoryId;
    const SubcategoryId = this.adsService.getCurrentAds()?.subCategoryId;
    const dy = this.adsService.getCurrentAds()?.DynamicFieldValues;
    if (!categoryId || !SubcategoryId || !dy) {
      this.router.navigateByUrl('/ads');
    }
    
    // Add mobile-specific optimizations
    this.setupMobileOptimizations();
  }

  private setupMobileOptimizations() {
    // Prevent zoom on input focus for iOS
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        if (window.innerWidth <= 768) {
          (input as HTMLElement).style.fontSize = '16px';
        }
      });
    });
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
      console.log('File selected:', file.name, file.size, file.type);
      this.processFile(file, boxId);
    } else {
      console.log('No file selected');
    }
    
    // Reset input value to allow selecting the same file again
    input.value = '';
  }

  // Handle input click for mobile devices
  onInputClick(event: Event) {
    const input = event.target as HTMLInputElement;
    
    // For mobile devices, ensure the input is properly configured
    if (this.isMobileDevice()) {
      // Remove any existing capture attribute to allow both camera and gallery
      input.removeAttribute('capture');
      
      // Add a small delay to ensure the click event is processed
      setTimeout(() => {
        input.click();
      }, 100);
    }
  }

  // Trigger file input for mobile devices
  triggerFileInput(boxId: number) {
    const input = document.getElementById(`file-input-${boxId}`) as HTMLInputElement;
    if (input) {
      // Clear any previous value
      input.value = '';
      
      // For mobile devices, show both camera and gallery options
      if (this.isMobileDevice()) {
        // Remove capture attribute to allow gallery selection
        input.removeAttribute('capture');
      }
      
      // Trigger the file input
      input.click();
    }
  }

  onDragOver(event: DragEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent | TouchEvent) {
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
      box.error = 'نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG, PNG أو WebP';
      return;
    }

    // Validate individual file size
    if (file.size > this.maxFileSize) {
      box.error = 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت';
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

    // Check if file already exists
    const existingFile = this.getUploadedFiles().find(f => 
      f.name === file.name && f.size === file.size
    );
    if (existingFile) {
      box.error = 'هذه الصورة مرفوعة مسبقاً';
      return;
    }

    // تحسين الصورة قبل الرفع
    this.optimizeImage(file).then(optimizedFile => {
      // Validate image dimensions for mobile
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
          img.onload = () => {
            // Check minimum dimensions
            if (img.width < 200 || img.height < 200) {
              box.error = 'الصورة صغيرة جداً. الحد الأدنى 200×200 بكسل';
              return;
            }
            
            // Check maximum dimensions
            if (img.width > 4000 || img.height > 4000) {
              box.error = 'الصورة كبيرة جداً. الحد الأقصى 4000×4000 بكسل';
              return;
            }
            
            box.file = optimizedFile;
            box.preview = e.target?.result as string;
            box.error = null;
          };
          img.onerror = () => {
            box.error = 'خطأ في تحميل الصورة';
          };
        } else {
          box.error = 'خطأ في قراءة الملف';
        }
      };
      reader.onerror = () => {
        box.error = 'خطأ في قراءة الملف';
      };
      reader.readAsDataURL(optimizedFile);
    }).catch(error => {
      console.error('Error optimizing image:', error);
      box.error = 'خطأ في تحسين الصورة';
    });
  }

  // تحسين الصورة لتقليل حجمها
  private async optimizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      // تحسين جميع الملفات بغض النظر عن الحجم
      console.log('Starting image optimization for:', file.name, 'Size:', this.formatFileSize(file.size));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          // تحديد الأبعاد المثلى حسب الجهاز والحجم الأصلي
          const isMobile = this.isMobileDevice();
          const originalSize = file.size;
          
          // تحديد الأبعاد بناءً على حجم الملف الأصلي
          let maxWidth, maxHeight, quality;
          
          if (originalSize > 3 * 1024 * 1024) { // أكبر من 3MB
            maxWidth = isMobile ? 800 : 1200;
            maxHeight = isMobile ? 600 : 900;
            quality = isMobile ? 0.6 : 0.7;
          } else if (originalSize > 1 * 1024 * 1024) { // أكبر من 1MB
            maxWidth = isMobile ? 1000 : 1400;
            maxHeight = isMobile ? 700 : 1000;
            quality = isMobile ? 0.65 : 0.75;
          } else { // أقل من 1MB
            maxWidth = isMobile ? 1200 : 1600;
            maxHeight = isMobile ? 800 : 1200;
            quality = isMobile ? 0.7 : 0.8;
          }
          
          let { width, height } = img;
          
          // تغيير الحجم إذا كان كبير جداً
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // رسم الصورة المحسنة
          ctx?.drawImage(img, 0, 0, width, height);
          
          // تحويل إلى blob مع جودة محسنة
          canvas.toBlob((blob) => {
            if (blob) {
              // إنشاء ملف جديد مع الاسم الأصلي
              const optimizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              
              const reduction = ((file.size - optimizedFile.size) / file.size * 100).toFixed(1);
              console.log(`Image optimized: ${this.formatFileSize(file.size)} -> ${this.formatFileSize(optimizedFile.size)} (${reduction}% reduction)`);
              
              // إذا كان التحسين غير فعال، نستخدم الملف الأصلي
              if (optimizedFile.size >= file.size) {
                console.log('Optimization not effective, using original file');
                resolve(file);
              } else {
                resolve(optimizedFile);
              }
            } else {
              console.warn('Failed to create blob, using original file');
              resolve(file);
            }
          }, file.type, quality);
          
        } catch (error) {
          console.error('Error optimizing image:', error);
          // في حالة الخطأ، نستخدم الملف الأصلي
          resolve(file);
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load image for optimization');
        // في حالة الخطأ، نستخدم الملف الأصلي
        resolve(file);
      };
      
      img.src = URL.createObjectURL(file);
    });
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
    return this.getUploadedCount() >= 3;
  }

  // Check if currently submitting
  isCurrentlySubmitting(): boolean {
    return this.isSubmitting;
  }

  // Get progress percentage
  getProgressPercentage(): number {
    return Math.round(this.submissionProgress);
  }

  // Get progress status text
  getProgressStatusText(): string {
    const progress = this.getProgressPercentage();
    if (progress < 10) return 'جاري التحضير...';
    if (progress < 30) return 'جاري التحقق من الملفات...';
    if (progress < 50) return 'جاري تجهيز البيانات...';
    if (progress < 80) return 'جاري رفع الصور...';
    if (progress < 100) return 'جاري حفظ الإعلان...';
    return 'تم الإنشاء بنجاح!';
  }

  savePhotos() {
    if (!this.hasUploadedFiles()) {
      this.saveError = 'يرجى رفع 3 صور على الأقل';
      return;
    }

    this.isSaving = true;
    this.isSubmitting = true;
    this.saveError = null;
    this.submissionProgress = 0;

    // Setup submission protection
    const cleanupProtection = this.setupSubmissionProtection();

    try {
      const files = this.getUploadedFiles();
      
      // Validate files before sending
      if (files.length === 0) {
        throw new Error('لا توجد ملفات للرفع');
      }

      // Get current ad data
      const currentAd = this.adsService.getCurrentAds();
      if (!currentAd) {
        throw new Error('بيانات الإعلان غير متوفرة');
      }

      console.log('Current ad data before saving:', currentAd);
      console.log('Files to upload:', files);

      // Update progress
      this.submissionProgress = 10;

      // Convert File[] to FileList
      const fileList = this.createFileList(files);

      // Update progress gradually
      this.updateProgress(20, 300);

      // Update ad with files
      const updatedAd = {
        ...currentAd,
        imageUrl: fileList
      };

      // Update progress gradually
      this.updateProgress(30, 300);

      // Save to service
      this.adsService.setCurrentAds(updatedAd);

      // Update progress gradually
      this.updateProgress(50, 300);

      console.log('Final ad data to submit:', this.adsService.getCurrentAds());

      // Submit ad based on type
      const submitObservable = updatedAd.isSpecific 
        ? this.adsService.createSpecificAd(updatedAd as any)
        : this.adsService.submitAd(updatedAd);
      
      submitObservable.subscribe({
        next: (res) => {
          // Update progress to 100% gradually
          this.updateProgress(100, 500);
          
          // Add a small delay to show completion
          setTimeout(() => {
            this.isSaving = false;
            this.isSubmitting = false;
            cleanupProtection(); // Remove protection
            
            if (updatedAd.isSpecific) {
              this.toastr.success(`تم إنشاء الإعلان المميز بنجاح لمدة ${updatedAd.activeMonths} شهر`, 'إعلانك المميز نشط الآن');
            } else {
              this.toastr.success('تم إنشاء الإعلان بنجاح', 'إعلانك قيد التحقق');
            }
            
            this.router.navigateByUrl("/");
          }, 1500);
        },
        error: (err) => {
          this.isSaving = false;
          this.isSubmitting = false;
          cleanupProtection(); // Remove protection
          console.error('Error submitting ad:', err);
          
          // Handle specific error cases
          if (err.isCorsError) {
            this.saveError = err.message || 'مشكلة في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى';
          } else if (err.isTimeout) {
            this.saveError = err.message || 'انتهت مهلة رفع الملفات. يرجى تقليل حجم الصور أو المحاولة مرة أخرى';
          } else if (err.isFileSizeError) {
            this.saveError = err.message || 'حجم الملفات كبير جداً. يرجى تقليل حجم الصور';
          } else if (err.isServerError) {
            this.saveError = err.message || 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً';
          } else if (err.status === 413) {
            this.saveError = 'حجم الملفات كبير جداً. يرجى تقليل حجم الصور';
          } else if (err.status === 408) {
            this.saveError = 'انتهت مهلة رفع الملفات. يرجى تقليل حجم الصور أو المحاولة مرة أخرى';
          } else if (err.status === 400) {
            this.saveError = 'بيانات الإعلان غير صحيحة. يرجى التحقق من المعلومات';
          } else if (err.status === 401) {
            this.saveError = 'يرجى تسجيل الدخول مرة أخرى';
            this.router.navigateByUrl('/login');
          } else if (err.status === 0) {
            this.saveError = 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى';
          } else if (err.status === 500) {
            this.saveError = 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً';
          } else if (err.status === 403) {
            this.saveError = 'ليس لديك صلاحية لإنشاء إعلان. يرجى التواصل مع الإدارة';
          } else if (err.status === 429) {
            this.saveError = 'تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار قليلاً والمحاولة مرة أخرى';
          } else {
            this.saveError = 'حدث خطأ أثناء حفظ الإعلان. يرجى المحاولة مرة أخرى';
          }
        },
      });
    } catch (error) {
      this.isSaving = false;
      this.isSubmitting = false;
      cleanupProtection(); // Remove protection
      console.error('Error in savePhotos:', error);
      this.saveError = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    }
  }

  // Helper method to create FileList from File[]
  private createFileList(files: File[]): FileList {
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));
    return dataTransfer.files;
  }

  // Helper method to update progress gradually
  private updateProgress(targetProgress: number, duration: number = 500) {
    const startProgress = this.submissionProgress;
    const progressDiff = targetProgress - startProgress;
    const steps = 10;
    const stepDuration = duration / steps;
    
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        this.submissionProgress = startProgress + (progressDiff * i / steps);
      }, i * stepDuration);
    }
  }

  // Prevent page refresh/close during submission
  private setupSubmissionProtection(): () => void {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (this.isSubmitting) {
        e.preventDefault();
        e.returnValue = 'جاري إنشاء الإعلان، هل أنت متأكد من أنك تريد المغادرة؟';
        return 'جاري إنشاء الإعلان، هل أنت متأكد من أنك تريد المغادرة؟';
      }
      return undefined;
    };

    const handleVisibilityChange = () => {
      if (document.hidden && this.isSubmitting) {
        // Show a notification when user switches tabs
        console.warn('تم تبديل التبويب أثناء إنشاء الإعلان');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

  // Handle camera capture on mobile
  onCameraCapture(event: Event, boxId: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.processFile(file, boxId);
    }
    
    // Reset input value
    input.value = '';
  }

  // Check if device is mobile
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Get device-specific tips
  getDeviceTips(): string {
    if (this.isMobileDevice()) {
      return '📱 يمكنك استخدام الكاميرا مباشرة لالتقاط الصور';
    }
    return '💻 اسحب الصور أو انقر لاختيارها من جهازك';
  }
}
