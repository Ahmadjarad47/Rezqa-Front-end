import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HomeAdsService } from '../home-ads.service';
import { AdPosts } from '../models/category';
import { catchError, finalize, of } from 'rxjs';
import { WishlistService } from '@app/dashboard/components/wishlist/wishlist.service';
import { NotificationService } from '@app/core/services/notification.service';

@Component({
  selector: 'app-ads-details',
  standalone: false,
  templateUrl: './ads-details.component.html',
  styleUrl: './ads-details.component.css',
})
export class AdsDetailsComponent implements OnInit {
  adsId: number = 0;
  category: string = '';
  adsTitle: string = '';
  adsService = inject(HomeAdsService);
  wishlistService = inject(WishlistService);
  notificationService = inject(NotificationService);
  constructor(private route: ActivatedRoute) {}
  post: AdPosts | null = null;
  loading: boolean = false;
  error: string | null = null;
  currentImageIndex: number = 0;

  ngOnInit(): void {
    // Get the parameters from the URL
    this.route.params.subscribe((params) => {
      this.adsId = +params['id'];
      this.category = decodeURIComponent(params['category'] || '');
      this.adsTitle = decodeURIComponent(params['ads'] || '');

      console.log('Extracted values:', {
        adsId: this.adsId,
        category: this.category,
        adsTitle: this.adsTitle,
      }); // Debug log

      if (this.adsId && !isNaN(this.adsId)) {
        this.loadPost();
      } else {
        this.error = 'معرف الإعلان غير صحيح';
        this.loading = false;
      }
    });
  }
  callPhoneNumber(post: any) {
    window.location.href = `tel:${post}`;
  }
  loadPost() {
    this.loading = true;
    this.error = null;

    console.log('Loading post with ID:', this.adsId); // Debug log

    this.adsService
      .getPostsId(this.adsId)
      .pipe(
        catchError((error) => {
          this.error = 'حدث خطأ في تحميل الإعلان';
          console.error('Error loading post:', error);
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (value) => {
          console.log('Post loaded successfully:', value); // Debug log
          if (value) {
            this.post = value;
          } else {
            this.error = 'لم يتم العثور على الإعلان';
            this.post = null;
          }
        },
      });
  }

  nextImage() {
    if (this.post && this.post.imageUrl.length > 1) {
      this.currentImageIndex =
        (this.currentImageIndex + 1) % this.post.imageUrl.length;
    }
  }

  previousImage() {
    if (this.post && this.post.imageUrl.length > 1) {
      this.currentImageIndex =
        this.currentImageIndex === 0
          ? this.post.imageUrl.length - 1
          : this.currentImageIndex - 1;
    }
  }

  selectImage(index: number) {
    this.currentImageIndex = index;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0,
    }).format(price);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-SY');
  }

  getFieldValue(fieldTitle: string): string {
    if (!this.post?.adFieldDtos) return '';
    const field = this.post.adFieldDtos.find((f) => f.title === fieldTitle);
    return field?.value || '';
  }

  copyPhoneNumber(num: string) {
    this.callPhoneNumber(num);
    if (num) {
      navigator.clipboard.writeText(num);
      // You can add a toast notification here
    }
  }

  shareAd() {
    if (navigator.share) {
      navigator.share({
        title: this.post?.title || 'إعلان',
        text: this.post?.description || '',
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
    }
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder.jpg';
  }

  encodeURIComponent(str: string): string {
    return encodeURIComponent(str);
  }

  addToWishlistHandler(adId: number) {
    this.wishlistService.addToWishlist({ adId }).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.notificationService.success('تم الاضافة للمفضلة');
        } else {
          this.notificationService.error(
            response.message || 'حدث خطأ أثناء الإضافة للمفضلة'
          );
        }
      },
      error: () => {
        this.notificationService.error('تم الاضافة مسبقاً');
      },
    });
  }
}
