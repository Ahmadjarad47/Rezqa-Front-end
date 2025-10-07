import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupportService } from '@app/admin/services/support.service';
import { UsersService } from '../users/users.service';
import { GetAllUsers } from '@app/admin/models/users/Crud';
import {
  Message,
  UserLastMessage,
} from '@app/admin/models/user-last-message.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-support',
  standalone: false,
  templateUrl: './support.component.html',
  styleUrl: './support.component.css',
})
export class SupportComponent implements OnInit, OnDestroy {
  supService = inject(SupportService);
  userService = inject(UsersService);

  allUsers: GetAllUsers[] = [];
  usersWithMessages: UserLastMessage[] = [];
  messages: Message[] = [];
  selectedUser: GetAllUsers | null = null;
  newMessage: string = '';
  loading: boolean = false;
  isBrowser: boolean = false;
  connectionReady: boolean = false;
  showEmojiPicker: boolean = false;
  onlineUserIds: string[] = [];

  commonEmojis: string[] = [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '🙃',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '😋',
    '😛',
    '😝',
    '😜',
    '🤪',
    '🤨',
    '🧐',
    '🤓',
    '😎',
    '🤩',
    '🥳',
    '😏',
    '😒',
    '😞',
    '😔',
    '😟',
    '😕',
    '🙁',
    '☹️',
    '😣',
    '😖',
    '😫',
    '😩',
    '🥺',
    '😢',
    '😭',
    '😤',
    '😠',
    '😡',
    '🤬',
    '🤯',
    '😳',
    '🥵',
    '🥶',
    '😱',
    '😨',
    '😰',
    '😥',
    '😓',
    '🤗',
    '🤔',
    '🤭',
    '🤫',
    '🤥',
  ];

  private subscriptions: Subscription[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit(): Promise<void> {
    if (this.isBrowser) {
      // Delay initialization to avoid hydration issues
      setTimeout(async () => {
        this.loadAllUsers();
        await this.startChatConnection();
        this.subscribeToMessages();
        this.setupClickOutsideHandler();
        this.subscribeToOnlineUsers();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.supService.stopConnection();
    }
  }

  loadAllUsers() {
    if (!this.isBrowser) return;

    this.loading = true;
    this.userService.getAllUsers(1,1000).subscribe({
      next: (value) => {
        this.allUsers = value.items;
        this.loading = false;
        
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;
      },
    });
  }

   startChatConnection() {
    if (!this.isBrowser) return;

    try {
       this.supService.startConnection();
      
      // Subscribe to connection state
      const connectionSub = this.supService.connectionReady$.subscribe(
        (ready) => {
          this.connectionReady = ready;
          if (ready) {
            // Only get chats when connection is ready
            this.supService.getChats();
          }
        }
      );

      this.subscriptions.push(connectionSub);
    } catch (error) {
      console.error('Error starting chat connection:', error);
    }
  }

  subscribeToMessages() {
    if (!this.isBrowser) return;

    // Subscribe to users with messages
    const usersSub = this.supService.usersLastMessage$.subscribe((users) => {
      this.usersWithMessages = users;
    });

    // Subscribe to messages
    const messagesSub = this.supService.usersMessage$.subscribe((messages) => {
      this.messages = messages;
    });

    this.subscriptions.push(usersSub, messagesSub);
  }

  async selectUser(user: GetAllUsers) {
    if (!this.isBrowser) return;

    await this.supService.joinWithUserGroup(user.id);

    this.selectedUser = user;
    await this.supService.GetMessagesWithUser(user.id);

    // Mark messages as read when user is selected
    await this.supService.markMessagesAsRead(user.id);
  }

  async sendMessage(event?: Event) {
    if (!this.isBrowser || !this.selectedUser || !this.newMessage.trim())
      return;

    // Prevent default behavior if it's a keyboard event
    if (event) {
      event.preventDefault();
    }

    await this.supService.sendMessage(
      this.selectedUser.id,
      this.newMessage.trim()
    );
    this.newMessage = '';
  }

  async deleteMessage(message: Message) {
    console.log(message);

    if (!this.isBrowser || !this.selectedUser || !message.id) {
      console.log(this.selectedUser);
      console.log(message.id);

      console.warn(
        'Cannot delete message: browser check failed or missing data'
      );
      return;
    }

    console.log('Attempting to delete message:', message);
    const messageId =
      typeof message.id === 'string' ? parseInt(message.id) : message.id;
    console.log(
      'Message ID to delete:',
      messageId,
      'User ID:',
      this.selectedUser.id
    );

    try {
      const success = await this.supService.deleteMessage(
        this.selectedUser.id,
        messageId
      );
      if (success) {
        console.log('Message deleted successfully');
      } else {
        console.error('Failed to delete message - service returned false');
      }
    } catch (error) {
      console.error('Error in deleteMessage:', error);
    }
  }

  isUserSentMessageAndNotRead(user: GetAllUsers): boolean {
    const userMessage = this.usersWithMessages.find(
      (um) => um.userId === user.id
    );
    return userMessage?.HasUnreadMessages || false;
  }

  getUserLastMessageTime(user: GetAllUsers): string {
    const userMessage = this.usersWithMessages.find(
      (um) => um.userId === user.id
    );
    return userMessage?.LastMessageTime || '';
  }

  getUserWithMessages(): GetAllUsers[] {
    return this.allUsers.filter((user) =>
      this.usersWithMessages.some((um) => um.userId === user.id)
    );
  }

  formatMessageTime(timeString: string): string {
    if (!timeString || !this.isBrowser) return '';

    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  }

  isMessageFromCurrentUser(message: Message): boolean {
    // Check if the message is from admin based on the isFromAdmin field
    return message.isFromAdmin;
  }

  // Track by functions for better performance
  trackByUserId(index: number, user: GetAllUsers): string {
    return user.id;
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id?.toString() || index.toString();
  }

  // Get unread message count for a user
  getUnreadCount(user: GetAllUsers): number {
    const userMessage = this.usersWithMessages.find(
      (um) => um.userId === user.id
    );
    return userMessage?.HasUnreadMessages ? 1 : 0;
  }

  // Check if a user is online
  isUserOnline(user: GetAllUsers): boolean {
    return this.onlineUserIds.includes(user.id);
  }

  // Get count of online users
  getOnlineUsersCount(): number {
    return this.onlineUserIds.length;
  }

  // Get online users from all users list
  getOnlineUsers(): GetAllUsers[] {
    return this.allUsers.filter((user) => this.isUserOnline(user));
  }

  // Emoji picker methods
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string) {
    this.newMessage += emoji;
    this.showEmojiPicker = false;
  }

  private setupClickOutsideHandler() {
    if (!this.isBrowser) return;

    document.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('.emoji-picker-container') &&
        !target.closest('.emoji-button')
      ) {
        this.showEmojiPicker = false;
      }
    });
  }

  private subscribeToOnlineUsers() {
    if (!this.isBrowser) return;

    // Remove the online users subscription since it doesn't exist on SupportService
    // const onlineUsersSub = this.supService.usersOnline$.subscribe(
    //   (users) => {
    //     this.onlineUserIds = users;
    //   }
    // );
    // this.subscriptions.push(onlineUsersSub);
  }
}
