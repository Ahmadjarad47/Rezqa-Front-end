import { Component, OnInit } from '@angular/core';
import { NotificationService } from '@app/core/services/notification.service';
import { Notification } from '@app/models/notification.model';

@Component({
  selector: 'app-notification',
  standalone: false,
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit  {
  constructor(public notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.getAllNotifications();
    this.notificationService.allNotifications$.subscribe((notifications) => {
      console.log(notifications);
    });
  }

  deleteNotification(notificationId: number): void {
    this.notificationService.deleteNotification(notificationId);
    this.notificationService.getAllNotifications();

  }

  clearAllNotifications(): void {
    this.notificationService.clearAllNotifications();
    this.notificationService.getAllNotifications();

  }

  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }
}
