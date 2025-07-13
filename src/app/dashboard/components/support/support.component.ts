import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  AfterViewChecked,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { AuthService } from 'src/app/identity/services/auth.service';
import {
  SupportSignalRService,
  SupportMessage,
} from './support-signalr.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-support',
  standalone: false,
  templateUrl: './support.component.html',
  styleUrl: './support.component.css',
})
export class SupportComponent
  implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked
{
  message: string = '';
  sending: boolean = false;
  sent: boolean = false;
  error: string | null = null;
  messages: SupportMessage[] = [];
  loadingMessages: boolean = false;
  messagesError: string | null = null;
  currentUserId: string | null = null;
  receiverId: string = '';
  @ViewChild('lastMessageDiv') lastMessageDiv!: ElementRef;
  private shouldScroll = false;
  private subscriptions: Subscription[] = [];
  isConnected: boolean = false;

  constructor(
    private supportSignalR: SupportSignalRService,
    private route: ActivatedRoute
  ) {}

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.lastMessageDiv) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.supportSignalR.stopConnection();
  }

  ngOnInit(): void {
    // Delay initialization to avoid hydration issues
    setTimeout(() => {
      this.initializeSupport();
    }, 100);
  }

  private async initializeSupport(): Promise<void> {
    try {
      // Start SignalR connection and wait for it to be ready
      await this.supportSignalR.startConnection();
      
      // Now get messages after connection is established
      await this.supportSignalR.getMessagesWithUser('other user id');

      if (this.route.snapshot.queryParams['ad']) {
        this.message =
          this.route.snapshot.queryParams['ad'] + ' الأعلان هذا' + '\n';
      }
      // Subscribe to connection status
      this.subscriptions.push(
        this.supportSignalR.connectionStatus$.subscribe(
          (status) => (this.isConnected = status)
        )
      );

      // Subscribe to messages
      this.subscriptions.push(
        this.supportSignalR.messages$.subscribe((messages) => {
          this.messages = messages;
          this.shouldScroll = true;

          // Mark messages as read when new messages arrive and user is viewing the chat
          if (messages.length > 0) {
            // this.markMessagesAsRead();
          }
        })
      );
    } catch (error) {
      console.error('Error initializing support:', error);
      this.error = 'فشل في الاتصال بخدمة الدعم الفني';
    }
  }

  private async markMessagesAsRead(): Promise<void> {
    try {
      // For user side, we mark admin messages as read
      // The backend will handle the logic to determine which messages to mark as read
      await this.supportSignalR.markMessagesAsRead('');
    } catch (error) {
      console.error('Error marking messages as read:', error);
      // Don't show error to user as this is not critical functionality
    }
  }

  async sendMessage(): Promise<void> {
    if (!this.message.trim() || this.sending) return;

    this.sending = true;
    this.error = null;

    try {
      // For user side, we don't need to specify receiverId as it will be handled by the backend
      await this.supportSignalR.sendMessage(this.message.trim(), '');

      this.message = '';
      this.sent = true;

      // Reset sent status after 2 seconds
      setTimeout(() => {
        this.sent = false;
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      this.error = 'فشل في إرسال الرسالة';
    } finally {
      this.sending = false;
    }
  }

  private scrollToBottom(): void {
    if (this.lastMessageDiv) {
      this.lastMessageDiv.nativeElement.scrollIntoView({ behavior: 'smooth' });

      // Mark messages as read when user scrolls to bottom (indicating they've read the messages)
      // this.markMessagesAsRead();
    }
  }

  isMyMessage(message: SupportMessage): boolean {
    // If message is from admin, it's not my message (user's message)
    // If message is not from admin, it's my message (user's message)
    return !message.isFromAdmin;
  }

  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getConnectionStatusText(): string {
    return this.isConnected ? 'متصل' : 'غير متصل';
  }

  getConnectionStatusClass(): string {
    return this.isConnected ? 'text-green-600' : 'text-red-600';
  }

  trackByMessageId(index: number, message: SupportMessage): number {
    return message.id;
  }

  onTextareaInput(event: any): void {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';

    // Limit message length to 500 characters
    if (this.message.length > 500) {
      this.message = this.message.substring(0, 500);
    }
  }

  getCharacterCounterClass(): string {
    const length = this.message.length;
    if (length > 450) return 'text-red-500 dark:text-red-400';
    if (length > 400) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-gray-400 dark:text-gray-500';
  }

  isMessageTooLong(): boolean {
    return this.message.length > 500;
  }

  onChatFocus(): void {
    // Mark messages as read when user focuses on the chat
    // this.markMessagesAsRead();
  }
}
