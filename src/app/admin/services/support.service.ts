import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '@environments/environment.development';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from '@microsoft/signalr';
import { BehaviorSubject, EMPTY } from 'rxjs';
import {
  Message,
  UserLastMessage,
  SupportMessage,
} from '../models/user-last-message.model';

@Injectable({
  providedIn: 'root',
})
export class SupportService {
  hubConnection: HubConnection | null = null;
  private isBrowser: boolean = false;
  private connectionReady = new BehaviorSubject<boolean>(false);

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  private usersLastMessageSoruce = new BehaviorSubject<UserLastMessage[]>([]);
  public usersLastMessage$ = this.usersLastMessageSoruce.asObservable();

  private usersMessageSoruce = new BehaviorSubject<Message[]>([]);
  public usersMessage$ = this.usersMessageSoruce.asObservable();

  public connectionReady$ = this.connectionReady.asObservable();

  startConnection() {
    if (!this.isBrowser) return;

    try {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(environment.baseUrl + '/hubs/messages')
        .withAutomaticReconnect()
        .build();

      this.hubConnection.start();
      // Set up message handler
      this.hubConnection.on('ReceiveMessage', (message: SupportMessage) => {
        console.log('Received message:', message);
        var old = this.usersMessageSoruce.value;
        // Convert SupportMessage to Message format
        const convertedMessage: Message = {
          id: message.id || undefined,
          senderId: message.senderId,
          receiverId: message.receiverId,
          message: message.message,
          isRead: message.isRead,
          sentAt: message.sentAt,
          isFromAdmin: message.isFromAdmin,
        };

        this.usersMessageSoruce.next([...old, convertedMessage]);
      });

      // Set up message deleted handler
      this.hubConnection.on('MessageDeleted', (messageId: number) => {
        console.log('Message deleted:', messageId);
        const currentMessages = this.usersMessageSoruce.value;
        const updatedMessages = currentMessages.filter(
          (msg) => msg.id !== messageId
        );
        this.usersMessageSoruce.next(updatedMessages);
      });

      // Start the connection and wait for it
      console.log('SignalR: Connected to messages hub!');
      this.connectionReady.next(true);
    } catch (error) {
      console.error('Error creating SignalR connection:', error);
      this.connectionReady.next(false);
      throw error;
    }
  }
   joinWithUserGroup(id: string) {
    if (this.hubConnection) {
      try {
     

         this.hubConnection.invoke('joinGroup', id);
      } catch (error) {
        console.error('Error joining group:', error);
      }
    }
  }
  private async waitForConnection(): Promise<boolean> {
    if (!this.hubConnection) return false;

    // If already connected, return immediately
    if (this.hubConnection.state === HubConnectionState.Connected) {
      return true;
    }

    // Wait for connection to be ready (max 10 seconds)
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 10000);

      const checkConnection = () => {
        if (this.hubConnection?.state === HubConnectionState.Connected) {
          clearTimeout(timeout);
          resolve(true);
        } else if (
          this.hubConnection?.state === HubConnectionState.Disconnected
        ) {
          clearTimeout(timeout);
          resolve(false);
        } else {
          // Check again in 100ms
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  async getChats() {
    if (!this.isBrowser || !this.hubConnection) return;

    try {
      const isConnected = await this.waitForConnection();
      if (!isConnected) {
        console.warn('SignalR: Connection not ready, cannot get chats');
        return;
      }

      const result = await this.hubConnection.invoke<UserLastMessage[]>(
        'GetContactedUsersOrdered'
      );
      this.usersLastMessageSoruce.next(result);
    } catch (error) {
      console.error('Error getting chats:', error);
    }
  }

  async sendMessage(otheruserId: string, message: string) {
    if (!this.isBrowser || !this.hubConnection) return;

    try {
      const isConnected = await this.waitForConnection();
      if (!isConnected) {
        console.warn('SignalR: Connection not ready, cannot send message');
        return;
      }

      await this.hubConnection.invoke('SendNewMessage', otheruserId, message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async GetMessagesWithUser(otheruserId: string) {
    if (!this.isBrowser || !this.hubConnection) return;

    try {
      const isConnected = await this.waitForConnection();
      if (!isConnected) {
        console.warn('SignalR: Connection not ready, cannot get messages');
        return;
      }

      const result = await this.hubConnection.invoke<SupportMessage[]>(
        'GetMessagesWithUser',
        otheruserId
      );

      // Convert SupportMessage[] to Message[]
      const convertedMessages: Message[] = result.map((msg) => ({
        id: msg.id || undefined,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        message: msg.message,
        isRead: msg.isRead,
        sentAt: msg.sentAt,
        isFromAdmin: msg.isFromAdmin,
      }));

      this.usersMessageSoruce.next(convertedMessages);
    } catch (error) {
      console.error('Error getting messages with user:', error);
    }
  }

  async markMessagesAsRead(otheruserId: string) {
    if (!this.isBrowser || !this.hubConnection) return;

    try {
      const isConnected = await this.waitForConnection();
      if (!isConnected) {
        console.warn(
          'SignalR: Connection not ready, cannot mark messages as read'
        );
        return;
      }

      await this.hubConnection.invoke('MarkMessagesAsRead', otheruserId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  async deleteMessage(
    otherUserId: string,
    messageId: number
  ): Promise<boolean> {
    if (!this.isBrowser || !this.hubConnection) {
      console.warn(
        'Cannot delete message: browser check failed or no hub connection'
      );
      return false;
    }

    try {
      console.log('Checking connection state for delete message...');
      const isConnected = await this.waitForConnection();
      if (!isConnected) {
        console.warn('SignalR: Connection not ready, cannot delete message');
        return false;
      }

      console.log('Connection ready, invoking DeleteMessage with:', {
        otherUserId,
        messageId,
      });
      const result = await this.hubConnection.invoke<boolean>(
        'DeleteMessage',
        otherUserId,
        messageId
      );
      console.log('DeleteMessage result:', result);
      return result;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  stopConnection() {
    if (!this.isBrowser || !this.hubConnection) return;

    try {
      this.hubConnection.stop();
      this.hubConnection = null;
      this.connectionReady.next(false);
    } catch (error) {
      console.error('Error stopping connection:', error);
    }
  }
}
