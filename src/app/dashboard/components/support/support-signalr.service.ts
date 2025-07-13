import { Injectable } from '@angular/core';
import { environment } from '@environments/environment.development';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

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
  private hubConnection: HubConnection | null = null;
  private messagesSubject = new BehaviorSubject<SupportMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  async startConnection(): Promise<void> {
    try {
      const token = this.getTokenFromCookies();
      if (!token) {
        console.warn('Authentication token not found, trying to connect without token');
        // Continue without token for now, the server will handle authentication
      }

      const builder = new HubConnectionBuilder()
        .withAutomaticReconnect();
      
      if (token) {
        builder.withUrl(`${environment.baseUrl}/hubs/messages`, {
          accessTokenFactory: () => token
        });
      } else {
        builder.withUrl(`${environment.baseUrl}/hubs/messages`);
      }
      
      this.hubConnection = builder.build();

      // Wait for connection to start
      await this.hubConnection.start();

      this.hubConnection.on('ReceiveMessage', (message: SupportMessage) => {
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, message]);
      });

      this.hubConnection.on('MessageDeleted', (messageId: number) => {
        const currentMessages = this.messagesSubject.value;
        const updatedMessages = currentMessages.filter(
          (msg) => msg.id !== messageId
        );
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

      this.connectionStatusSubject.next(true);
      console.log('SignalR Connected');
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      this.connectionStatusSubject.next(false);
      throw error;
    }
  }

  async sendMessage(message: string, receiverId: string): Promise<void> {
    // Wait for connection to be ready
    await this.waitForConnection();

    try {
      await this.hubConnection!.invoke('SendNewMessage', receiverId, message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessagesWithUser(otherUserId: string): Promise<SupportMessage[]> {
    // Wait for connection to be ready
    await this.waitForConnection();

    try {
      const messages = await this.hubConnection!.invoke<SupportMessage[]>(
        'GetMessagesWithUser',
        otherUserId
      );
      
      // Update the messages subject with the received messages
      this.messagesSubject.next(messages || []);
      
      return messages || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  private async waitForConnection(): Promise<void> {
    if (!this.hubConnection) {
      throw new Error('SignalR connection not initialized');
    }

    // Wait for connection to be established
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    
    while (this.hubConnection.state !== HubConnectionState.Connected && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (this.hubConnection.state !== HubConnectionState.Connected) {
      throw new Error('SignalR connection failed to establish within timeout period');
    }
  }

  async markMessagesAsRead(otherUserId: string): Promise<void> {
    // Wait for connection to be ready
    await this.waitForConnection();

    try {
      await this.hubConnection!.invoke('MarkMessagesAsRead', otherUserId);
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
    return this.hubConnection?.state === HubConnectionState.Connected;
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
