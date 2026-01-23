# SmartGrocer – Development Guide

SmartGrocer is a mobile application built with **Expo + React Native + Firebase** that helps users manage grocery shopping lists and track household stock with intelligent reminder notifications.

---

## **Features**

### 1. **Grocery List Management**

- Create, view, edit and delete grocery lists
- Add items to each list with quantities
- Mark items as purchased while shopping
- Real-time sync across devices via Firestore

### 2. **Shopping Mode**

- Simplified interface for shopping
- Tick off items as you purchase them
- Progress bar shows completion percentage
- Fast, tap-to-complete UX

### 3. **Stock Tracking**

- Add purchased items to your stock inventory
- Set quantity and expected duration (days)
- App calculates depletion date automatically
- Track remaining days until stock runs out

### 4. **Smart Reminders**

- Automatic notifications before stock reaches critical level
- Scheduled using Expo's local notification system
- Reminders trigger 2 days (or less) before depletion
- Restock button resets tracking and reschedules reminders

### 5. **Dashboard**

- Overview of active lists and low stock items
- Quick access to all features
- Visual cards showing counts and alerts

---

## **Tech Stack**

- **Framework**: Expo (React Native)
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Firebase (Authentication + Firestore)
- **Notifications**: Expo Notifications (local reminders)
- **State Management**: React Context API

---

## **Project Structure**

```
app/
  (auth)/
    login.tsx          # User login
    register.tsx       # User registration
  (dashboard)/
    home.tsx           # Main dashboard
    lists.tsx          # All grocery lists
    list-details/[id].tsx  # Individual list with items
    create-list.tsx    # Create new list
    shopping-mode.tsx  # Shopping mode interface
    stock.tsx          # Stock inventory view
    add-stock.tsx      # Add new stock item
    notifications.tsx  # Notification center (placeholder)
  index.tsx            # Entry point (redirects based on auth)

services/
  firebaseConfig.ts    # Firebase initialization
  authService.ts       # Login, register, logout

context/
  AuthContext.tsx      # Global auth state

utils/
  notifications.ts     # Toast messages + local notification scheduling

types/
  user.ts              # User type definitions
```

---

## **Installation & Setup**

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase project with Firestore and Authentication enabled

### Steps

1. **Clone the repo**

   ```bash
   git clone <your-repo-url>
   cd Grocery-App-main
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Email/Password authentication
   - Enable Firestore database
   - Copy your Firebase config and replace values in [services/firebaseConfig.ts](services/firebaseConfig.ts)

4. **Install Expo Notifications** (if missing)

   ```bash
   npx expo install expo-notifications
   ```

   _Note: If you encounter network issues, you can manually add `"expo-notifications"` to `package.json` and run `npm install`._

5. **Run the app**
   ```bash
   npm start
   ```
   Then:
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app on physical device

---

## **Core Workflows**

### **1. User Registration & Login**

- Users register with email/password via [app/(auth)/register.tsx](<app/(auth)/register.tsx>)
- Firebase Authentication creates user account
- User document saved in Firestore at `users/{uid}`
- After login, users are redirected to dashboard

### **2. Creating a Grocery List**

- From dashboard, tap "Create List"
- Enter list name → saved in `users/{uid}/lists/{listId}`
- Navigate to list details to add items

### **3. Adding Items to a List**

- In [list-details/[id].tsx](<app/(dashboard)/list-details/[id].tsx>), tap "+" button
- Enter item name → saved in `users/{uid}/lists/{listId}/items/{itemId}`
- Each item tracks `name`, `completedCount`, and `quantity`

### **4. Shopping Mode**

- From list details or dashboard, enter shopping mode
- Tap items to mark as purchased (increments `completedCount`)
- Progress bar updates in real-time
- All changes sync via Firestore

### **5. Adding Stock Items**

- From dashboard, tap "Add Stock"
- Enter item name, quantity, unit, and expected duration (days)
- App calculates:
  - `depletionDate` = startDate + duration
  - `reminderScheduledAt` = depletionDate - 2 days (or less)
- Local notification scheduled via `expo-notifications`
- Item saved in `users/{uid}/stock/{stockId}`

### **6. Restocking Items**

- In [stock.tsx](<app/(dashboard)/stock.tsx>), tap "Restock" button
- Updates `startDate` to now
- Recalculates depletion and reminder dates
- Cancels old notification and schedules new one

---

## **Data Model**

### **Firestore Collections**

```
users/
  {uid}/
    - email
    - fullName
    - createdAt

    lists/
      {listId}/
        - name
        - createdAt

        items/
          {itemId}/
            - name
            - quantity (number)
            - completedCount (number)

    stock/
      {stockId}/
        - name
        - quantity (number)
        - unit (string)
        - expectedDurationDays (number)
        - startDate (timestamp)
        - depletionDate (timestamp)
        - reminderScheduledAt (timestamp)
        - reminderId (string | null)
```

---

## **Key Files**

### [utils/notifications.ts](utils/notifications.ts)

- `showToast()`: Display toast messages
- `showConfirmation()`: Alert dialogs
- `requestNotificationPermissions()`: Request notification access
- `scheduleStockReminder()`: Schedule local notification
- `cancelReminder()`: Cancel scheduled notification

### [services/authService.ts](services/authService.ts)

- `loginUser()`: Email/password login
- `registerUser()`: Create new user account
- `logoutUser()`: Sign out

### [context/AuthContext.tsx](context/AuthContext.tsx)

- Provides global user state
- Listens to Firebase auth state changes
- Exposes `login()` and `logout()` methods

---

## **Notification System**

SmartGrocer uses **Expo Notifications** for local (on-device) reminders. Notifications are **not** push notifications from a server — they are scheduled locally on the device.

### How it works:

1. When user adds a stock item, the app calculates when it will run out
2. A reminder is scheduled 2 days before depletion (or sooner if duration < 2 days)
3. The notification ID is saved in Firestore
4. When user restocks, old notification is canceled and new one scheduled

### To enable notifications:

- Android: Works automatically
- iOS: Requires user permission prompt (handled in `requestNotificationPermissions()`)

---

## **Running on Physical Devices**

### Android

1. Install **Expo Go** from Play Store
2. Scan QR code from terminal
3. Notifications work out of the box

### iOS

1. Install **Expo Go** from App Store
2. Scan QR code from terminal
3. Allow notification permissions when prompted

---

## **Common Issues**

### "expo-notifications not found"

**Solution**: Install it manually:

```bash
npm install expo-notifications
```

### Firebase "permission denied"

**Solution**: Check Firestore rules. For development, use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Network timeout during install

**Solution**: Check internet connection or try:

```bash
npm config set registry https://registry.npmjs.org/
npm install
```

---

## **Future Enhancements**

- [ ] Add shopping history and analytics
- [ ] Barcode scanning for faster item entry
- [ ] Recipe suggestions based on stock
- [ ] Shared lists for families
- [ ] Price tracking per item
- [ ] Push notifications from server (for shared lists)

---

## **Contributing**

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m "Add feature"`)
4. Push to branch (`git push origin feature/my-feature`)
5. Open a pull request

---

## **License**

MIT License - feel free to use this project for learning or commercial purposes.

---

## **Support**

For questions or issues, open an issue on GitHub or contact the maintainer.

---

**Happy Grocery Shopping! 🛒🥦🍞**
