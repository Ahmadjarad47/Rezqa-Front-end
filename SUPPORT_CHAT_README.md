# Support Chat Feature Documentation

## Overview
This document describes the implementation of the user-admin support chat feature using SignalR in the Angular application.

## Features
- Real-time messaging between users and admin
- Message history persistence using in-memory cache
- Read/unread message status
- Connection status indicator
- Responsive design with Flowbite/Tailwind CSS
- Arabic language support (RTL)

## Architecture

### Backend (C# SignalR Hub)
The backend uses a `Messages` Hub that handles:
- User connections and group management
- Message sending and receiving
- Message history retrieval
- Read status management
- Admin-specific operations

### Frontend (Angular)
The frontend consists of:
- `SupportSignalRService`: Manages SignalR connection and message handling
- `SupportComponent`: UI component for the chat interface

## Components

### SupportSignalRService
Located at: `src/app/dashboard/components/support/support-signalr.service.ts`

**Key Methods:**
- `startConnection()`: Establishes SignalR connection with authentication
- `sendMessage(message, receiverId)`: Sends a message to the specified user
- `getMessagesWithUser(otherUserId)`: Retrieves message history
- `markMessagesAsRead(otherUserId)`: Marks messages as read
- `stopConnection()`: Closes the SignalR connection

**Observables:**
- `messages$`: Stream of messages
- `connectionStatus$`: Connection status updates

### SupportComponent
Located at: `src/app/dashboard/components/support/support.component.ts`

**Features:**
- Real-time message display
- Message input with validation
- Connection status indicator
- Auto-scroll to latest message
- Error handling and user feedback

## Usage

### For Users
1. Navigate to the dashboard support page
2. The component automatically connects to SignalR
3. Type your message and click send
4. Messages are automatically sent to available admin users
5. Real-time updates show when admin responds

### For Admins
1. Admins can see all user conversations
2. Join specific user conversations using `joinGroup(userId)`
3. Send messages to users
4. View message history and read status

## API Endpoints

### SignalR Hub Methods
- `SendNewMessage(otherId, message)`: Send a message
- `GetMessagesWithUser(otherUserId)`: Get message history
- `MarkMessagesAsRead(otherUserId)`: Mark messages as read
- `GetContactedUsersOrdered()`: Get list of users who contacted admin (admin only)
- `DeleteMessage(otherUserId, messageId)`: Delete a message (admin only)

### SignalR Events
- `ReceiveMessage`: New message received
- `MessageDeleted`: Message deleted notification
- `ReceiveNotification`: Notification for offline users

## Configuration

### Environment Setup
Make sure your `environment.development.ts` has the correct API URL:
```typescript
export const environment = {
  apiUrl: 'https://localhost:7109/api/',
  // ... other config
};
```

### Authentication
The service automatically retrieves the access token from cookies for SignalR authentication.

## Styling
The component uses Flowbite and Tailwind CSS classes for styling:
- Responsive design
- RTL support for Arabic
- Modern chat interface
- Loading states and animations

## Error Handling
- Connection failures are handled gracefully
- User-friendly error messages in Arabic
- Automatic reconnection attempts
- Fallback for offline scenarios

## Security
- JWT token authentication for SignalR connections
- Role-based access control (Admin/User)
- Input validation and sanitization
- Secure cookie handling

## Performance
- In-memory caching for message history
- Automatic message cleanup after 3 days
- Efficient SignalR connection management
- Optimized re-rendering with OnPush change detection

## Troubleshooting

### Common Issues
1. **Connection Failed**: Check if the backend SignalR hub is running
2. **Authentication Error**: Verify JWT token is valid and not expired
3. **Messages Not Loading**: Check network connectivity and API endpoints
4. **Real-time Updates Not Working**: Verify SignalR connection status

### Debug Tips
- Check browser console for SignalR connection logs
- Verify environment configuration
- Test with browser developer tools network tab
- Check authentication token in browser cookies

## Future Enhancements
- File/image sharing
- Typing indicators
- Message reactions
- Push notifications
- Message search functionality
- Conversation archiving 