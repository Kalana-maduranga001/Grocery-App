# Persistent Notifications System

## Overview

The app now includes a **persistent notification system** that alerts users when stock items are running low. Notifications remain visible until the user explicitly marks them as seen or deletes them.

## How It Works

### 1. **Automatic Notification Creation**

- When a stock item has **1 day or less** remaining before depletion, a notification is automatically created
- Notifications are stored in Firestore under `users/{userId}/notifications`
- **Only one unseen notification per stock item** is created (no duplicates)

### 2. **Notification Persistence**

- Notifications are stored in Firestore and persist across:
  - App closures
  - Background states
  - Device restarts
- They remain visible until manually marked as seen or deleted

### 3. **Notification Display**

The Notifications screen shows:

- **Unseen notifications** (highlighted in orange with red dot indicator)
- **Seen notifications** (grayed out)
- Item name, remaining days, and action buttons
- Unread count badge in the header

### 4. **User Actions**

From the Notifications screen, users can:

- **Mark Seen**: Dismiss unseen notification (button only shows for unseen items)
- **Delete**: Permanently remove notification
- Navigate back to home/dashboard

## Firestore Schema

### Notifications Collection

```
users/{userId}/notifications/
├── {notificationId}
│   ├── stockItemId: string (reference to stock item)
│   ├── itemName: string (e.g., "Rice")
│   ├── message: string (descriptive text)
│   ├── daysRemaining: number (1-10)
│   ├── seen: boolean (false = unseen, true = seen)
│   └── createdAt: Timestamp (creation time)
```

## Implementation Details

### Files Modified

#### 1. **app/(dashboard)/notifications.tsx**

- Fetches real notifications from Firestore
- Shows unseen count badge
- Displays notifications with color coding
- Handles mark-as-seen and delete actions
- Sorts by newest first

#### 2. **app/(dashboard)/stock.tsx**

- Monitors stock items in real-time
- Auto-creates notifications when `daysRemaining <= 1`
- Uses `createStockNotification()` utility

#### 3. **utils/notifications.ts** (NEW FUNCTION)

```typescript
export async function createStockNotification(
  userId: string,
  stockItemId: string,
  itemName: string,
  daysRemaining: number,
);
```

- Checks if unseen notification already exists
- Prevents duplicate notifications
- Creates new document in Firestore

## User Experience Flow

```
Stock Item Added
    ↓
Days Until Depletion Decrease
    ↓
Days Remaining ≤ 1
    ↓
✓ Notification Auto-Created in Firestore
    ↓
Notification Screen Shows Orange Card
    ↓
User Sees Unread Badge & Message
    ↓
User Options:
  ├─ Mark Seen → Turns to gray
  └─ Delete → Removes from list
```

## Features

✅ **Persistent** - Survives app closure  
✅ **No Auto-Dismiss** - Stays until user acts  
✅ **No Duplicates** - Only one per stock item  
✅ **Real-Time** - Updates as stock depletes  
✅ **Visual Feedback** - Red dot for unseen, orange highlight  
✅ **Easy Discovery** - Unread count badge in header

## Testing the System

### Test Case 1: Auto-Create Notification

1. Go to Add Stock
2. Add item with 1-day duration
3. Check Notifications screen → Should see new notification

### Test Case 2: Persistence

1. Create notification (as above)
2. Close and reopen app
3. Go to Notifications → Notification still visible

### Test Case 3: Mark as Seen

1. Open Notifications screen
2. Click "Mark Seen" button
3. Notification changes to gray

### Test Case 4: Delete

1. Click "Delete" button
2. Notification removed from list

## Firestore Rules (Recommended)

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/notifications/{notificationId} {
      allow read, write: if request.auth.uid == userId;
      allow delete: if request.auth.uid == userId;
    }
  }
}
```

## Future Enhancements

- Push notifications when app is fully closed
- Notification sound/vibration options
- Notification grouping by item type
- Weekly digest of all low-stock items
- Snooze notification for X hours
