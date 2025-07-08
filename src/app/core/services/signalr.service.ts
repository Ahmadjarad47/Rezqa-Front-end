import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '@environments/environment';
import { Notification } from '../../models/notification.model';
import { AuthService } from '../../identity/services/auth.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection: HubConnection | null = null;
  
  private connectionEstablished = new BehaviorSubject<boolean>(false);
  private notificationReceived = new Subject<Notification>();
  private usersOnline = new Subject<string[]>();



  public connectionEstablished$ = this.connectionEstablished.asObservable();
  public notificationReceived$ = this.notificationReceived.asObservable();
  public usersOnline$ = this.usersOnline.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  public async startConnection(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          `${environment.apiUrl.replace('/api/', '')}/hubs/notifications`,
          {}
        )
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      await this.hubConnection.start();

      this.hubConnection.on("onlineUsers",(users:string[])=>{
        
        this.usersOnline.next(users)
      })

      this.setupSignalRHandlers();
      console.log('SignalR Connected!');
      this.connectionEstablished.next(true);
    } catch (err) {
      console.error('Error while establishing SignalR connection: ', err);
      this.connectionEstablished.next(false);
    }
  }

  private setupSignalRHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on(
      'ReceiveNotification',
      (notification: Notification) => {
        console.log('Notification received:', notification);
        this.notificationReceived.next(notification);
      }
    );

    this.hubConnection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.connectionEstablished.next(false);
    });

    this.hubConnection.onreconnecting((error) => {
      console.log('SignalR reconnecting:', error);
      this.connectionEstablished.next(false);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.connectionEstablished.next(true);
    });
  }

  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
      this.connectionEstablished.next(false);
    }
  }

  public async markAsRead(notificationId: string): Promise<void> {
    if (this.hubConnection && this.connectionEstablished.value) {
      try {
        await this.hubConnection.invoke('MarkAsRead', notificationId);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    }
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
