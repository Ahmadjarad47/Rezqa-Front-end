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

  public unreadCount$ = this.notifications$.pipe(
    map((notifications) => notifications.filter((n) => n.status === 0).length)
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
      this.toastService.warning(notification.message);
    });
  }

  public async loadNotifications(): Promise<void> {
    this.loadingSubject.next(true);
    try {
      const notifications = await this.signalRService.getNotifications();
      this.notificationsSubject.next(notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.toastService.error('فشل في تحميل الإشعارات');
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
      this.toastService.error('فشل في تحميل الإشعارات');
    } finally {
      this.loadingSubject.next(false);
    }
  }

  public async deleteNotification(notificationId: number): Promise<void> {
    try {
      await this.signalRService.deleteNotification(notificationId);
      this.removeNotification(notificationId);
      this.toastService.success('تم حذف الإشعار');
    } catch (error) {
      console.error('Error deleting notification:', error);
      this.toastService.error('فشل في حذف الإشعار');
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

  public success(message: string, title?: string) {
    this.toastService.success(message, title);
  }

  public error(message: string, title?: string) {
    this.toastService.error(message, title);
  }

  public warning(message: string, title?: string) {
    this.toastService.warning(message, title);
  }

  public info(message: string, title?: string) {
    this.toastService.info(message, title);
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
      this.toastService.error('فشل في إرسال الإشعار');
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
      this.toastService.error('فشل في إرسال الإشعار لجميع المستخدمين');
      throw error;
    }
  }

  public async changeNotificationStatus(notificationId: number, status: number): Promise<void> {
    try {
      if (this.signalRService["changeNotificationStatus"]) {
        await this.signalRService["changeNotificationStatus"](notificationId, status);
      }
      this.updateNotificationStatus(notificationId.toString(), status);
      this.toastService.success('تم تغيير حالة الإشعار');
    } catch (error) {
      console.error('Error changing notification status:', error);
      this.toastService.error('فشل في تغيير حالة الإشعار');
    }
  }
}
