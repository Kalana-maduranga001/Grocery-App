import { Alert, Platform } from "react-native";
import Toast from "react-native-toast-message";
import { db } from "@/services/firebaseConfig";
import * as Notifications from "expo-notifications";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";

// Configure notification handling behavior with beautiful styling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Enhanced toast with theme colors
export const showToast = (
  type: "success" | "error" | "info",
  text1: string,
  text2?: string,
) => {
  Toast.show({
    type,
    text1,
    text2,
    position: "top",
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
    // Custom styling to match app theme
    text1Style: {
      fontSize: 16,
      fontWeight: "700",
      color: "#3D2417",
    },
    text2Style: {
      fontSize: 14,
      fontWeight: "500",
      color: "#8B4513",
    },
  });
};

// Enhanced confirmation with theme styling
export const showConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
) => {
  Alert.alert(
    title,
    message,
    [
      { 
        text: "Cancel", 
        style: "cancel",
        onPress: onCancel,
      },
      { 
        text: "Confirm", 
        onPress: onConfirm,
        style: "destructive",
      },
    ],
    { 
      cancelable: true,
      userInterfaceStyle: "dark", // Matches dark theme
    },
  );
};

// Request permissions for push/local notifications
export async function requestNotificationPermissions() {
  try {
    const settings = await Notifications.getPermissionsAsync();
    
    if (!settings.granted) {
      const req = await Notifications.requestPermissionsAsync();
      
      if (!req.granted) {
        showToast(
          "error",
          "Notifications Disabled",
          "Enable notifications to receive stock alerts",
        );
        return false;
      }
    }
    
    // Android: ensure default channel exists with theme styling
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("stock-reminders", {
        name: "Stock Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6B00", // Theme orange color
        description: "Alerts for low stock and expired items",
      });

      await Notifications.setNotificationChannelAsync("stock-expired", {
        name: "Expired Stock",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: "#FF4444", // Red for urgent
        description: "Critical alerts for expired items",
      });
    }
    
    return true;
  } catch (error) {
    console.error("Failed to request notification permissions:", error);
    return false;
  }
}

// Schedule a local reminder for a specific date with theme styling
export async function scheduleStockReminder(
  itemName: string,
  remindAt: Date,
  body?: string,
  isExpired: boolean = false,
) {
  const ok = await requestNotificationPermissions();
  if (!ok) return null;

  try {
    // Ensure remindAt is a valid future date
    const now = new Date();
    if (remindAt <= now) {
      // If the reminder time is in the past, schedule for 5 minutes from now
      remindAt = new Date(now.getTime() + 5 * 60 * 1000);
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: isExpired ? `⚠️ ${itemName} EXPIRED!` : `🔔 Restock ${itemName}`,
        body: body ?? (isExpired 
          ? `${itemName} has expired and needs immediate attention!`
          : `${itemName} is running low. Consider restocking soon.`
        ),
        sound: true,
        priority: isExpired 
          ? Notifications.AndroidNotificationPriority.MAX 
          : Notifications.AndroidNotificationPriority.HIGH,
        color: isExpired ? "#FF4444" : "#FF6B00", // Theme colors
        badge: 1,
        data: {
          itemName,
          isExpired,
          type: "stock-reminder",
        },
      },
      trigger: {
        channelId: isExpired ? "stock-expired" : "stock-reminders",
        date: remindAt,
      },
    });
    
    console.log(`[NOTIFICATION] Scheduled local notification for ${itemName}, ID: ${id}`);
    return id;
  } catch (error) {
    console.error("Failed to schedule notification:", error);
    return null;
  }
}

// Cancel a scheduled reminder
export async function cancelReminder(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`[NOTIFICATION] Cancelled notification: ${notificationId}`);
  } catch (error) {
    console.error("Failed to cancel notification:", error);
  }
}

// Create a persistent notification in Firestore when stock is running low or expired
export async function createStockNotification(
  userId: string,
  stockItemId: string,
  itemName: string,
  daysRemaining: number,
  isExpired: boolean = false,
) {
  try {
    console.log(
      `[NOTIFICATION] Attempting to create for ${itemName}, days: ${daysRemaining}, expired: ${isExpired}`,
    );

    const notificationsRef = collection(db, "users", userId, "notifications");

    // Check for existing unseen notifications to prevent duplicates
    const q = query(
      notificationsRef,
      where("stockItemId", "==", stockItemId),
      where("seen", "==", false),
    );
    const existingSnap = await getDocs(q);

    // If unseen notification already exists, don't create duplicate
    if (existingSnap.size > 0) {
      console.log(
        `[NOTIFICATION] Duplicate avoided - unseen notification already exists for ${itemName}`,
      );
      return;
    }

    // Create new unseen notification with themed message
    const message = isExpired
      ? `⚠️ ${itemName} has EXPIRED and needs to be removed from stock!`
      : `⏱️ ${itemName} is running low and will be depleted in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`;

    const newDoc = await addDoc(notificationsRef, {
      stockItemId,
      itemName,
      message,
      daysRemaining: Math.max(0, daysRemaining),
      isExpired: isExpired,
      seen: false,
      createdAt: serverTimestamp(),
    });

    console.log(
      `[NOTIFICATION] ✅ Created successfully for ${itemName}, ID: ${newDoc.id}`,
    );

    // Also schedule a local push notification for immediate alert
    const remindAt = new Date();
    remindAt.setSeconds(remindAt.getSeconds() + 2); // Schedule 2 seconds from now
    await scheduleStockReminder(itemName, remindAt, message, isExpired);

  } catch (error) {
    console.error(`[NOTIFICATION] ❌ Failed to create for ${itemName}:`, error);
  }
}

// Clean up old seen notifications (call periodically)
export async function cleanupOldNotifications(
  userId: string, 
  daysOld: number = 30
) {
  try {
    const notificationsRef = collection(db, "users", userId, "notifications");
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldQuery = query(
      notificationsRef,
      where("seen", "==", true),
      where("createdAt", "<", Timestamp.fromDate(cutoffDate)),
    );

    const oldSnap = await getDocs(oldQuery);
    
    if (oldSnap.empty) {
      console.log("[NOTIFICATION] No old notifications to clean up");
      return;
    }

    let deletedCount = 0;
    const deletePromises = oldSnap.docs.map((docSnap) => {
      deletedCount++;
      return deleteDoc(doc(db, "users", userId, "notifications", docSnap.id));
    });

    await Promise.all(deletePromises);
    
    console.log(`[NOTIFICATION] ✅ Cleaned up ${deletedCount} old notifications`);
    
    if (deletedCount > 0) {
      showToast(
        "success", 
        "Notifications Cleaned", 
        `Removed ${deletedCount} old notification${deletedCount !== 1 ? 's' : ''}`
      );
    }
  } catch (error) {
    console.error("[NOTIFICATION] ❌ Failed to cleanup old notifications:", error);
  }
}

// Mark all notifications as seen for a specific stock item
export async function dismissStockNotifications(
  userId: string, 
  stockItemId: string
) {
  try {
    const notificationsRef = collection(db, "users", userId, "notifications");
    const q = query(
      notificationsRef,
      where("stockItemId", "==", stockItemId),
      where("seen", "==", false),
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log(`[NOTIFICATION] No unseen notifications for stock item: ${stockItemId}`);
      return;
    }

    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, "users", userId, "notifications", docSnap.id))
    );
    
    await Promise.all(deletePromises);
    console.log(`[NOTIFICATION] ✅ Dismissed ${snapshot.size} notifications for stock item: ${stockItemId}`);
    
    showToast(
      "success",
      "Notifications Cleared",
      "Stock item notifications have been dismissed"
    );
  } catch (error) {
    console.error("[NOTIFICATION] ❌ Failed to dismiss notifications:", error);
  }
}

// Get all scheduled notification IDs
export async function getAllScheduledNotifications() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`[NOTIFICATION] ${scheduled.length} scheduled notifications found`);
    return scheduled;
  } catch (error) {
    console.error("[NOTIFICATION] Failed to get scheduled notifications:", error);
    return [];
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("[NOTIFICATION] ✅ All scheduled notifications cancelled");
    showToast("success", "Cleared", "All scheduled notifications cancelled");
  } catch (error) {
    console.error("[NOTIFICATION] ❌ Failed to cancel all notifications:", error);
  }
}

// Initialize notifications on app start
export async function initializeNotifications(userId: string) {
  try {
    console.log("[NOTIFICATION] Initializing notification system...");
    
    // Request permissions
    const granted = await requestNotificationPermissions();
    
    if (granted) {
      // Clean up old notifications (older than 30 days)
      await cleanupOldNotifications(userId, 30);
      
      console.log("[NOTIFICATION] ✅ Notification system initialized");
    } else {
      console.log("[NOTIFICATION] ⚠️ Notification permissions not granted");
    }
  } catch (error) {
    console.error("[NOTIFICATION] ❌ Failed to initialize notifications:", error);
  }
}