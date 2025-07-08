export interface Notification {
  id: number;
  userId: string;
  title: string;
  message: string;
  createdAt: string;
  status: NotificationStatus;
}

export enum NotificationStatus {
  Unread = 'Unread',
  Read = 'Read'
}

export interface NotificationResponse {
  isSuccess: boolean;
  message: string;
  data?: Notification[];
}

export interface MarkAsReadRequest {
  notificationId: string;
}

export interface DeleteNotificationRequest {
  notificationId: number;
} 