import { Injectable } from '@angular/core';
import { Notification } from '@app/models/notification.model';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { SignalRService } from './signalr.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private allNotificationsSubject = new BehaviorSubject<Notification[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private selectedStatusSubject = new BehaviorSubject<string>('all');

  public notifications$ = this.notificationsSubject.asObservable();
  public allNotifications$ = this.allNotificationsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public selectedStatus$ = this.selectedStatusSubject.asObservable();

  public unreadCount$: Observable<number> = this.notifications$.pipe(
    map((notifications: Notification[]) =>
      notifications.filter((n: Notification) => n.status === 0).length
    )
  );

  public filteredNotifications$ = combineLatest([
    this.notifications$,
    this.selectedStatus$,
  ]).pipe(
    map(([notifications, status]) => {
      if (status === 'all') return notifications;
      return notifications.filter((n) => n.status === Number(status));
    })
  );

  constructor(
    private signalRService: SignalRService,
    private toastService: ToastrService
  ) {
    this.initializeSignalR();
  }

  private initializeSignalR(): void {
    // Subscribe to real-time notifications
    this.signalRService.notificationReceived$.subscribe((notification) => {
      this.addNotification(notification);
      this.info(notification.message);
    });
  }

  public async loadNotifications(): Promise<void> {
    this.loadingSubject.next(true);
    try {
      const notifications = await this.signalRService.getNotifications();
      this.notificationsSubject.next(notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }
  public async getAllNotifications(): Promise<void> {
    this.loadingSubject.next(true);
    try {
      const notifications = await this.signalRService.getAllNotifications();
      this.allNotificationsSubject.next(notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  public async deleteNotification(notificationId: number): Promise<void> {
    try {
      await this.signalRService.deleteNotification(notificationId);
      this.removeNotification(notificationId);
      this.success('تم حذف الإشعار');
    } catch (error) {
      console.error('Error deleting notification:', error);
      this.error('فشل في حذف الإشعار');
    }
  }

  public setStatusFilter(status: string): void {
    this.selectedStatusSubject.next(status);
  }

  public markAllAsRead(): void {
    this.signalRService.markAllAsRead();
  }

  public clearAllNotifications(): void {
    const notifications = this.notificationsSubject.value;
    notifications.forEach((notification) => {
      this.deleteNotification(notification.id);
    });
  }

  private addNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...currentNotifications]);
  }

  private updateNotificationStatus(
    notificationId: string,
    status: number
  ): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map((notification) =>
      notification.id.toString() === notificationId
        ? { ...notification, status }
        : notification
    );
    this.notificationsSubject.next(updatedNotifications);
  }

  private removeNotification(notificationId: number): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(
      (notification) => notification.id !== notificationId
    );
    this.notificationsSubject.next(filteredNotifications);
  }

  public getUnreadCount(): number {
    return this.notificationsSubject.value.filter((n) => n.status === 0).length;
  }

  public async startConnection(): Promise<void> {
    await this.signalRService.startConnection();
  }

  public async stopConnection(): Promise<void> {
    await this.signalRService.stopConnection();
  }

  public getConnectionStatus(): Observable<boolean> {
    return this.signalRService.connectionEstablished$;
  }

  private getToastHtml(
    type: 'success' | 'error' | 'info' | 'warning',
    message: string
  ): string {
    let icon = '';
    switch (type) {
      case 'success':
        icon = `<span class="custom-toast-icon" aria-label="Success"><svg fill='none' viewBox='0 0 24 24' width='24' height='24'><circle cx='12' cy='12' r='12' fill='#fff' opacity='0.15'/><path d='M7 13l3 3 7-7' stroke='#fff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/></svg></span>`;
        break;
      case 'error':
        icon = `<span class="custom-toast-icon" aria-label="Error"><svg fill='none' viewBox='0 0 24 24' width='24' height='24'><circle cx='12' cy='12' r='12' fill='#fff' opacity='0.15'/><path d='M15 9l-6 6M9 9l6 6' stroke='#fff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/></svg></span>`;
        break;
      case 'info':
        icon = `<span class="custom-toast-icon" aria-label="Info"><svg fill='none' viewBox='0 0 24 24' width='24' height='24'><circle cx='12' cy='12' r='12' fill='#fff' opacity='0.15'/><path d='M12 8v4m0 4h.01' stroke='#fff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/></svg></span>`;
        break;
      case 'warning':
        icon = `<span class="custom-toast-icon" aria-label="Warning"><svg fill='none' viewBox='0 0 24 24' width='24' height='24'><circle cx='12' cy='12' r='12' fill='#fff' opacity='0.15'/><path d='M12 8v4m0 4h.01' stroke='#fff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/></svg></span>`;
        break;
    }
    return `<div style='display:flex;align-items:center;'>${icon}<div style='flex:1;'>${message}</div></div>`;
  }

  public success(message: string, title?: string) {
    this.toastService.success(this.getToastHtml('success', message), title, {
      enableHtml: true,
    });
  }

  public error(message: string, title?: string) {
    this.toastService.error(this.getToastHtml('error', message), title, {
      enableHtml: true,
    });
  }

  public warning(message: string, title?: string) {
    this.toastService.warning(this.getToastHtml('warning', message), title, {
      enableHtml: true,
    });
  }

  public info(message: string, title?: string) {
    this.toastService.info(this.getToastHtml('info', message), title, {
      enableHtml: true,
    });
  }

  public async sendNotificationToUser(
    userId: string,
    title: string,
    message: string
  ): Promise<void> {
    try {
      // You may need to implement this in SignalRService or use HTTP
      await this.signalRService.sendNotification(userId, title, message);
    } catch (error) {
      this.error('فشل في إرسال الإشعار');
      throw error;
    }
  }

  public async sendNotificationToAllUsers(
    title: string,
    message: string
  ): Promise<void> {
    try {
      await this.signalRService.sendNotificationToAllUsers(title, message);
    } catch (error) {
      this.error('فشل في إرسال الإشعار لجميع المستخدمين');
      throw error;
    }
  }

  public async changeNotificationStatus(
    notificationId: number,
    status: number
  ): Promise<void> {
    try {
      if (this.signalRService['changeNotificationStatus']) {
        await this.signalRService['changeNotificationStatus'](
          notificationId,
          status
        );
      }
      this.updateNotificationStatus(notificationId.toString(), status);
      this.success('تم تغيير حالة الإشعار');
    } catch (error) {
      console.error('Error changing notification status:', error);
      this.error('فشل في تغيير حالة الإشعار');
    }
  }
}
