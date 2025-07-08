# Notification System Implementation

This document describes the implementation of a real-time notification system using SignalR in the Angular frontend that connects to your .NET backend.

## Overview

The notification system provides:
- Real-time notifications via SignalR
- Notification management (mark as read, delete)
- Filtering by status (all, unread, read)
- Notification badge in navbar
- Responsive design with RTL support

## Backend Requirements

Your backend should have a SignalR hub similar to this:

```csharp
[Authorize]
public class NotificationsHub : Hub
{
    private readonly INotificationRepository _notificationRepository;

    public NotificationsHub(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task SendNotification(string title, string message)
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            throw new UnauthorizedAccessException("User not authenticated");

        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            CreatedAt = DateTime.UtcNow,
            Status = NotificationStatus.Unread,
        };
        await _notificationRepository.AddAsync(notification);
        await Clients.User(userId).SendAsync("ReceiveNotification", notification);
    }

    public async Task MarkAsRead(Guid notificationId)
    {
        await _notificationRepository.MarkAsReadAsync(notificationId);
    }

    [Authorize(Roles = "Admin")]
    public async Task DeleteNotification(int notificationId)
    {
        await _notificationRepository.DeleteAsync(notificationId);
    }

    public async Task<List<Notification>> GetNotifications(string? status = null)
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            throw new UnauthorizedAccessException("User not authenticated");

        NotificationStatus? notificationStatus = null;
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<NotificationStatus>(status, out var parsedStatus))
        {
            notificationStatus = parsedStatus;
        }
        
        return await _notificationRepository.GetByUserIdAsync(userId, notificationStatus);
    }
}
```

And register it in your `Program.cs`:

```csharp
app.MapHub<Rezqa.API.Hubs.NotificationsHub>("/hubs/notifications");
```

## Frontend Implementation

### Files Created/Modified

1. **Models** (`src/app/models/notification.model.ts`)
   - `Notification` interface
   - `NotificationStatus` enum
   - Response interfaces

2. **SignalR Service** (`src/app/core/services/signalr.service.ts`)
   - Handles SignalR connection
   - Manages real-time communication
   - Automatic reconnection

3. **Notification Service** (`src/app/dashboard/components/notification/notification.service.ts`)
   - Manages notification state
   - Provides filtering and actions
   - Integrates with SignalR service

4. **Notification Component** (`src/app/dashboard/components/notification/`)
   - Main notification UI
   - Real-time updates
   - Filtering and actions

5. **Navbar Integration** (`src/app/core/components/navbar/`)
   - Notification badge
   - Unread count display

### Key Features

#### Real-time Notifications
- Automatic SignalR connection when user is authenticated
- Real-time notification reception
- Toast notifications for new messages

#### Notification Management
- Mark individual notifications as read
- Mark all notifications as read
- Delete notifications (admin only)
- Clear all notifications

#### Filtering
- Filter by status: All, Unread, Read
- Real-time count updates
- Statistics display

#### UI/UX
- Responsive design
- RTL support for Arabic
- Loading states
- Empty states
- Connection status indicator
- Modern animations and transitions

## Usage

### For Users
1. Navigate to `/dashboard/notification` to view all notifications
2. Use the filter dropdown to view specific notification types
3. Click the checkmark to mark notifications as read
4. Use "Mark All as Read" to mark all unread notifications

### For Admins
1. Additional delete functionality for notifications
2. Can delete individual notifications
3. Can clear all notifications

### For Developers
1. The notification badge in the navbar shows unread count
2. SignalR connection is automatically managed
3. Notifications are stored in local state and synced with backend

## Configuration

### Environment Setup
Make sure your `environment.ts` has the correct API URL:

```typescript
export const environment = {
  apiUrl: 'https://your-api-url.com/api/',
  // ... other config
};
```

### SignalR Connection
The SignalR service automatically:
- Connects when user is authenticated
- Reconnects on connection loss
- Uses JWT token for authentication
- Handles connection errors gracefully

## Dependencies

The following packages are required:
- `@microsoft/signalr` - For SignalR client functionality
- `ngx-toastr` - For toast notifications (already installed)

## Security

- SignalR connection uses JWT authentication
- Admin-only operations are properly protected
- User can only access their own notifications
- Proper error handling for unauthorized access

## Troubleshooting

### Connection Issues
1. Check if the backend SignalR hub is running
2. Verify the hub URL in the SignalR service
3. Ensure JWT token is valid and not expired
4. Check browser console for connection errors

### Notification Not Showing
1. Verify user is authenticated
2. Check if SignalR connection is established
3. Ensure notification service is properly initialized
4. Check browser console for errors

### Performance Issues
1. Notifications are loaded on-demand
2. Real-time updates are efficient
3. Connection is automatically managed
4. Proper cleanup on component destruction

## Future Enhancements

Potential improvements:
- Notification sound alerts
- Push notifications
- Notification preferences
- Notification categories
- Bulk operations
- Notification history
- Export functionality 