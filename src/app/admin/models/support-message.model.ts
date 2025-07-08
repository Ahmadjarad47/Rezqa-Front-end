export interface SupportMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string; // ISO string
  conversationId: string;
  isRead: boolean;
  content: string;
  sentAt: string; // ISO string
} 