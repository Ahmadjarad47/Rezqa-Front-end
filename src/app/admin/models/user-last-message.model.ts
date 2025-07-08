export interface UserLastMessage {
  userId: string; // Replace 'any' with your actual user type if available
  HasUnreadMessages: boolean;
  LastMessageTime: string // Replace 'any' with your actual message type if available
}

export interface Message {
  id?: string | number;
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  sentAt: string; // ISO string or Date if parsed
  isFromAdmin: boolean;
}

// Backend SupportMessage structure
export interface SupportMessage {
  id?: number;
  message: string;
  isRead: boolean;
  senderId: string;
  receiverId: string;
  sentAt: string;
  isFromAdmin: boolean;
}
