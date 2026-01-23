import { Alert, Platform } from "react-native";
import Toast from "react-native-toast-message";
// Expo local notifications for stock reminders
import * as Notifications from "expo-notifications";

// Configure notification handling behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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
  });
};

export const showConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
) => {
  Alert.alert(
    title,
    message,
    [
      { text: "Cancel", style: "cancel" },
      { text: "OK", onPress: onConfirm },
    ],
    { cancelable: true },
  );
};

// Request permissions for push/local notifications
export async function requestNotificationPermissions() {
  const settings = await Notifications.getPermissionsAsync();
  if (!settings.granted) {
    const req = await Notifications.requestPermissionsAsync();
    if (!req.granted) {
      showToast(
        "error",
        "Notifications disabled",
        "Enable notifications for stock reminders",
      );
      return false;
    }
  }
  // Android: ensure default channel exists
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("stock-reminders", {
      name: "Stock Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return true;
}

// Schedule a local reminder for a specific date
export async function scheduleStockReminder(
  itemName: string,
  remindAt: Date,
  body?: string,
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
        title: `Restock ${itemName}`,
        body: body ?? `${itemName} is running low. Consider restocking.`,
        sound: false,
      },
      trigger: {
        type: "date",
        timestamp: remindAt.getTime(),
      },
    });
    return id;
  } catch (error) {
    console.error("Failed to schedule notification:", error);
    // Return null on error, but don't crash the stock save
    return null;
  }
}

export async function cancelReminder(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    // no-op
  }
}
