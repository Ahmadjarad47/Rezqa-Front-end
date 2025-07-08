import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import {
  Notification,
  NotificationStatus,
} from '../../../models/notification.model';
import { AuthService } from '../../../identity/services/auth.service';
import { NotificationService } from '@app/core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: false,
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css',
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications$: Observable<Notification[]>;
  loading$: Observable<boolean>;
  unreadCount$: Observable<number>;
  selectedStatus$: Observable<string>;

  private subscriptions = new Subscription();
  isConnected = false;
  statusOptions = [
    { value: 'all', label: 'جميع الإشعارات' },
    { value: NotificationStatus.Unread, label: 'غير مقروءة' },
    { value: NotificationStatus.Read, label: 'مقروءة' },
  ];

  constructor(
    public notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.notifications$ = this.notificationService.filteredNotifications$;
    this.loading$ = this.notificationService.loading$;
    this.unreadCount$ = this.notificationService.unreadCount$;
    this.selectedStatus$ = this.notificationService.selectedStatus$;
  }

  ngOnInit(): void {
    this.initializeNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private async initializeNotifications(): Promise<void> {
    // Start SignalR connection
    await this.notificationService.startConnection();

    // Subscribe to connection status
    this.subscriptions.add(
      this.notificationService
        .getConnectionStatus()
        .subscribe((isConnected) => {
          this.isConnected = isConnected;
          if (isConnected) {
            this.notificationService.loadNotifications();
          }
        })
    );
  }

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.notificationService.setStatusFilter(target.value);
    }
  }

  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }

  onMarkAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }

  onDeleteNotification(notificationId: number): void {
    if (confirm('هل أنت متأكد من حذف هذا الإشعار؟')) {
      this.notificationService.deleteNotification(notificationId);
    }
  }

  onMarkAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  onClearAll(): void {
    if (confirm('هل أنت متأكد من حذف جميع الإشعارات؟')) {
      this.notificationService.clearAllNotifications();
    }
  }

  getStatusClass(status: NotificationStatus): string {
    return status === NotificationStatus.Unread ? 'unread' : 'read';
  }

  getStatusText(status: NotificationStatus): string {
    return status === NotificationStatus.Unread ? 'غير مقروء' : 'مقروء';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );
      return `منذ ${diffInMinutes} دقيقة`;
    } else if (diffInHours < 24) {
      return `منذ ${Math.floor(diffInHours)} ساعة`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `منذ ${diffInDays} يوم`;
    }
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.roles?.includes('Admin') || false;
  }
}
