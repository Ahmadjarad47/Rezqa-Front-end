export interface Notification {
  id: number;
  userId: string;
  title: string;
  message: string;
  createdAt: string;
  status: number;
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