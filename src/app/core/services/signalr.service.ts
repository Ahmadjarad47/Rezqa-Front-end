import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject, take } from 'rxjs';
import { Notification } from '../../models/notification.model';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '@environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection: HubConnection | null = null;
  private connectionEstablished = new BehaviorSubject<boolean>(false);
  private notificationReceived = new Subject<Notification>();
  private usersOnline = new Subject<string[]>();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000; // 2 seconds

  public connectionEstablished$ = this.connectionEstablished.asObservable();
  public notificationReceived$ = this.notificationReceived.asObservable();
  public usersOnline$ = this.usersOnline.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  public async startConnection(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.isConnecting || this.hubConnection) {
      return;
    }

    this.isConnecting = true;

    try {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          `${environment.apiUrl.replace('/api/', '')}/hubs/notifications`,
          {
            skipNegotiation: true,
            transport: 1 // WebSockets only for better performance
          }
        )
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            if (retryContext.previousRetryCount === 0) {
              return 0;
            }
            if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
              return this.reconnectDelay * retryContext.previousRetryCount;
            }
            return null; // Stop trying to reconnect
          }
        })
        .configureLogging(LogLevel.Warning) // Reduce logging for better performance
        .build();

       this.hubConnection.start();
      this.setupSignalRHandlers();
   
      this.connectionEstablished.next(true);
      this.reconnectAttempts = 0;
    } catch (err) {
      console.error('Error while establishing SignalR connection: ', err);
      this.connectionEstablished.next(false);
      this.handleConnectionError();
    } finally {
      this.isConnecting = false;
    }
  }

  private handleConnectionError(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.startConnection();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private setupSignalRHandlers(): void {
    if (!this.hubConnection) return;

    // Remove previous handlers to prevent duplicate events
    this.hubConnection.off('ReceiveNotification');
    this.hubConnection.off('onlineUsers');

    this.hubConnection.on(
      'ReceiveNotification',
      (notification: Notification) => {
        console.log('Notification received:', notification);
        this.notificationReceived.next(notification);
      }
    );

    this.hubConnection.on('onlineUsers', (users: string[]) => {
      this.usersOnline.next(users);
    });

    this.hubConnection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.connectionEstablished.next(false);
      this.hubConnection = null;
    });

    this.hubConnection.onreconnecting((error) => {
      console.log('SignalR reconnecting:', error);
      this.connectionEstablished.next(false);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.connectionEstablished.next(true);
      this.reconnectAttempts = 0;
    });
  }

  public async stopConnection(): Promise<void> {
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (error) {
        console.warn('Error stopping SignalR connection:', error);
      } finally {
        this.hubConnection = null;
        this.connectionEstablished.next(false);
      }
    }
  }

  public async markAllAsRead(): Promise<void> {
    if (this.hubConnection && this.connectionEstablished.value) {
      try {
        await this.hubConnection.invoke('MarkAsRead');
      } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    }
  }

  public async getAllNotifications(): Promise<Notification[]> {
    if (this.hubConnection && this.connectionEstablished.value) {
      try {
        return await this.hubConnection.invoke('GetAllNotifications');
      } catch (error) {
        console.error('Error getting all notifications:', error);
        throw error;
      }
    }
    return [];
  }

  public async deleteNotification(notificationId: number): Promise<void> {
    if (this.hubConnection && this.connectionEstablished.value) {
      try {
        await this.hubConnection.invoke('DeleteNotification', notificationId);
      } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }
    }
  }

  public async getNotifications(status?: string): Promise<Notification[]> {
    if (this.hubConnection && this.connectionEstablished.value) {
      try {
        return await this.hubConnection?.invoke('GetNotifications', status);
      } catch (error) {
        console.error('Error getting notifications:', error);
        throw error;
      }
    }
    return [];
  }

  public async changeNotificationStatus(notificationId: number, status: number): Promise<void> {
    if (this.hubConnection && this.connectionEstablished.value) {
      try {
        await this.hubConnection.invoke('ChangeNotificationStatus', notificationId, status);
      } catch (error) {
        console.error('Error changing notification status:', error);
        throw error;
      }
    } else {
      throw new Error('SignalR connection is not established');
    }
  }

  public isConnected(): boolean {
    return this.connectionEstablished.value;
  }

  public async sendNotification(
    userId: string,
    title: string,
    message: string
  ): Promise<void> {
    if (this.hubConnection && this.connectionEstablished.value) {
      try {
        await this.hubConnection.invoke(
          'SendNotification',
          userId,
          title,
          message
        );
      } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
      }
    } else {
      throw new Error('SignalR connection is not established');
    }
  }

  public async sendNotificationToAllUsers(
    title: string,
    message: string
  ): Promise<void> {
    if (this.hubConnection && this.connectionEstablished.value) {
      try {
        await this.hubConnection.invoke(
          'SendAllUsersNotification',
          title,
          message
        );
      } catch (error) {
        console.error('Error sending notification to all users:', error);
        throw error;
      }
    } else {
      throw new Error('SignalR connection is not established');
    }
  }
}
