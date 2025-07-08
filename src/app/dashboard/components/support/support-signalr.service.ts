import { Injectable } from '@angular/core';
import { environment } from '@environments/environment.development';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'src/app/identity/services/auth.service';

export interface SupportMessage {
  id: number;
  senderId: string;
  receiverId: string;
  message: string;
  sentAt: string;
  isRead: boolean;
  isFromAdmin: boolean;
}

@Injectable({ providedIn: 'root' })
export class SupportSignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private messagesSubject = new BehaviorSubject<SupportMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  async startConnection(): Promise<void> {
    try {
     

      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.apiUrl.replaceAll('/api','')}hubs/messages`, {
        })
        .withAutomaticReconnect()
        .build();

      this.setupSignalRHandlers();

      await this.hubConnection.start();
      this.connectionStatusSubject.next(true);
      console.log('SignalR Connected');
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      this.connectionStatusSubject.next(false);
      throw error;
    }
  }

  private setupSignalRHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('ReceiveMessage', (message: SupportMessage) => {
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, message]);
    });

    this.hubConnection.on('MessageDeleted', (messageId: number) => {
      const currentMessages = this.messagesSubject.value;
      const updatedMessages = currentMessages.filter(msg => msg.id !== messageId);
      this.messagesSubject.next(updatedMessages);
    });

    this.hubConnection.onreconnecting(() => {
      this.connectionStatusSubject.next(false);
      console.log('SignalR Reconnecting...');
    });

    this.hubConnection.onreconnected(() => {
      this.connectionStatusSubject.next(true);
      console.log('SignalR Reconnected');
    });

    this.hubConnection.onclose(() => {
      this.connectionStatusSubject.next(false);
      console.log('SignalR Connection Closed');
    });
  }

  async sendMessage(message: string, receiverId: string): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection is not established');
    }

    try {
      await this.hubConnection.invoke('SendNewMessage', receiverId, message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessagesWithUser(otherUserId: string): Promise<SupportMessage[]> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection is not established');
    }

    try {
      const messages = await this.hubConnection.invoke<SupportMessage[]>('GetMessagesWithUser', otherUserId);
      this.messagesSubject.next(messages);
      return messages;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  async markMessagesAsRead(otherUserId: string): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection is not established');
    }

    try {
      await this.hubConnection.invoke('MarkMessagesAsRead', otherUserId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
        this.connectionStatusSubject.next(false);
        console.log('SignalR Disconnected');
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
      }
    }
  }

  isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }

  private getTokenFromCookies(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'accessToken') {
        return value;
      }
    }
    return null;
  }
} 