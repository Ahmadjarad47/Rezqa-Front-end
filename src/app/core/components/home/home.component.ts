import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryDto, HomeService } from '@app/core/services/home.service';
import { AuthService } from '@app/identity/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  isAuthenticated = false;
  categories: CategoryDto[] = [];
  loading = false;

  // متغيرات للصفحات
  pageNumber = 1;
  pageSize = 6;
  totalPages = 1;

  // App download URLs - Update these with your actual URLs
  readonly APK_DOWNLOAD_URL = 'https://example.com/syrainsooq-app.apk'; // Replace with actual APK URL
  readonly GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.syrainsooq.app'; // Replace with actual Play Store URL
  readonly APP_STORE_URL = 'https://apps.apple.com/app/syrainsooq/id123456789'; // Replace with actual App Store URL

  constructor(
    private router: Router,
    private authService: AuthService,
    public homeService: HomeService,
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.fetchCategories();
  }

  fetchCategories(loadMore: boolean = false): void {
    this.loading = true;
    this.homeService.getCategories(this.pageNumber, this.pageSize).subscribe({
      next: (result) => {
        this.totalPages = result.totalPages;
        if (loadMore) {
          this.categories = [...this.categories, ...result.items];
        } else {
          this.categories = result.items;
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        // يمكنك إضافة إشعار بالخطأ هنا
      }
    });
  }

  onLoadMore(): void {
    if (this.pageNumber < this.totalPages && !this.loading) {
      this.pageNumber++;
      this.fetchCategories(true);
    }
  }

  onGetStarted(): void {
    if (this.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/all']);
    }
  }

  onLearnMore(): void {
    // Implement learn more functionality
    console.log('Learn more clicked');
  }

  // App download methods
  onDownloadAPK(): void {
    try {
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = this.APK_DOWNLOAD_URL;
      link.download = 'syrainsooq-app.apk';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      this.showDownloadNotification('تم بدء تحميل التطبيق', 'success');
    } catch (error) {
      console.error('Download failed:', error);
      this.showDownloadNotification('فشل في تحميل التطبيق', 'error');
    }
  }

  onGooglePlayDownload(): void {
    try {
      // Open Google Play Store in new tab
      window.open(this.GOOGLE_PLAY_URL, '_blank');
      
      // Show success message
      this.showDownloadNotification('تم فتح متجر Google Play', 'success');
    } catch (error) {
      console.error('Google Play redirect failed:', error);
      this.showDownloadNotification('فشل في فتح متجر Google Play', 'error');
    }
  }

  private showDownloadNotification(message: string, type: 'success' | 'error'): void {
    // Create a simple notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg notification-enter ${
      type === 'success' 
        ? 'bg-green-500 text-white border border-green-400' 
        : 'bg-red-500 text-white border border-red-400'
    }`;
    
    // Add icon based on type
    const icon = type === 'success' ? '✓' : '✗';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="text-lg mr-2">${icon}</span>
        <span>${message}</span>
      </div>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('notification-enter');
      notification.classList.add('notification-exit');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Detect if user is on mobile device
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Detect if user is on iOS device
  isIOSDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Detect if user is on Android device
  isAndroidDevice(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  // Smart download method that detects device and suggests appropriate download
  onSmartDownload(): void {
    if (this.isIOSDevice()) {
      // On iOS, redirect to App Store
      this.onAppStoreDownload();
    } else if (this.isAndroidDevice()) {
      // On Android, prefer Google Play Store
      this.onGooglePlayDownload();
    } else {
      // On desktop, prefer direct APK download
      this.onDownloadAPK();
    }
  }

  // App Store download method
  onAppStoreDownload(): void {
    try {
      // Open App Store in new tab
      window.open(this.APP_STORE_URL, '_blank');
      
      // Show success message
      this.showDownloadNotification('تم فتح App Store', 'success');
    } catch (error) {
      console.error('App Store redirect failed:', error);
      this.showDownloadNotification('فشل في فتح App Store', 'error');
    }
  }
}
