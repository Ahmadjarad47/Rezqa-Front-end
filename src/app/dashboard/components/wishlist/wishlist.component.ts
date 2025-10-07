import { Component, OnInit } from '@angular/core';
import {
  WishlistService,
  WishlistItem,
  WishlistResponse,
} from './wishlist.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-wishlist',
  standalone: false,
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css',
})
export class WishlistComponent implements OnInit {
  wishlistItems: WishlistItem[] = [];
  loading = false;
  totalCount = 0;

  constructor(
    private wishlistService: WishlistService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }
  // GoToAds(ads: WishlistItem) {
  //   this.router.navigateByUrl();
  // }
  loadWishlist(): void {
    this.loading = true;
    this.wishlistService.getWishlist().subscribe({
      next: (response: WishlistResponse) => {
        if (response.isSuccess) {
          this.wishlistItems = response.items || [];
          this.totalCount = response.totalCount;
        } else {
          this.notificationService.error(
            response.message || 'فشل في تحميل المفضلة'
          );
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading wishlist:', error);
        this.loading = false;
      },
    });
  }

  removeFromWishlist(adId: number): void {
    this.wishlistService.removeFromWishlist({ adId }).subscribe({
      next: (response: WishlistResponse) => {
        if (response.isSuccess) {
          this.wishlistItems = this.wishlistItems.filter(
            (item) => item.adId !== adId
          );
          this.totalCount = response.totalCount;
          this.notificationService.success('تم إزالة العنصر من المفضلة');
        } else {
          this.notificationService.error(
            response.message || 'فشل في إزالة العنصر'
          );
        }
      },
      error: (error) => {
        console.error('Error removing item from wishlist:', error);
        this.notificationService.error('فشل في إزالة العنصر من المفضلة');
      },
    });
  }

  clearWishlist(): void {
    if (confirm('هل أنت متأكد من أنك تريد مسح المفضلة بالكامل؟')) {
      this.wishlistService.clearWishlist().subscribe({
        next: (response: WishlistResponse) => {
          if (response.isSuccess) {
            this.wishlistItems = [];
            this.totalCount = 0;
            this.notificationService.success('تم مسح المفضلة بنجاح');
          } else {
            this.notificationService.error(
              response.message || 'فشل في مسح المفضلة'
            );
          }
        },
        error: (error) => {
          console.error('Error clearing wishlist:', error);
          this.notificationService.error('فشل في مسح المفضلة');
        },
      });
    }
  }

  getImageUrl(imageUrls?: string[]): string {
    if (imageUrls && imageUrls.length > 0) {
      return imageUrls[0];
    }
    return 'assets/images/placeholder.jpg';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/placeholder.jpg';
  }
}
