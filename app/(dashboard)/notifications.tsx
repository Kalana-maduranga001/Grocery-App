import { useAuth } from "@/hooks/useAuth";
import { db } from "@/services/firebaseConfig";
import { showToast } from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type Notification = {
  id: string;
  stockItemId: string;
  itemName: string;
  message: string;
  daysRemaining: number;
  isExpired?: boolean;
  seen: boolean;
  createdAt: any;
};

export default function Notifications() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);

  // Fetch notifications from Firestore
  useEffect(() => {
    if (!user) return;
    const notificationsRef = collection(db, "users", user.uid, "notifications");
    const unsub = onSnapshot(
      notificationsRef,
      (snapshot) => {
        const notifs: Notification[] = [];
        snapshot.forEach((d) => {
          notifs.push({ id: d.id, ...(d.data() as any) } as Notification);
        });
        // Sort by newest first
        notifs.sort(
          (a, b) =>
            b.createdAt?.toDate?.()?.getTime() ||
            0 - (a.createdAt?.toDate?.()?.getTime() || 0),
        );
        setNotifications(notifs);
        setUnseenCount(notifs.filter((n) => !n.seen).length);
      },
      (error) => {
        console.error("Notifications listener error:", error);
      },
    );
    return () => unsub();
  }, [user]);

  // Mark notification as seen
  const markAsSeen = async (notificationId: string) => {
    if (!user) return;
    try {
      const notifRef = doc(
        db,
        "users",
        user.uid,
        "notifications",
        notificationId,
      );
      await updateDoc(notifRef, { seen: true });
      showToast("success", "Marked", "Notification dismissed");
    } catch (error) {
      console.error("Error marking notification as seen:", error);
      showToast("error", "Failed", "Could not mark notification");
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    try {
      const notifRef = doc(
        db,
        "users",
        user.uid,
        "notifications",
        notificationId,
      );
      await deleteDoc(notifRef);
      showToast("success", "Deleted", "Notification removed");
    } catch (error) {
      console.error("Error deleting notification:", error);
      showToast("error", "Failed", "Could not delete notification");
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-green-600 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">Notifications</Text>
          </View>
          {unseenCount > 0 && (
            <View className="bg-red-500 rounded-full px-2 py-1">
              <Text className="text-white text-xs font-bold">
                {unseenCount}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 mt-4"
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View className="items-center mt-20">
            <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-lg">
              No notifications yet
            </Text>
            <Text className="text-gray-400 mt-2 text-center">
              You'll receive reminders here when your stock items are running
              low.
            </Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <View
              key={notif.id}
              className={`rounded-xl p-4 mb-4 shadow-sm border ${
                notif.isExpired
                  ? notif.seen
                    ? "bg-gray-100 border-gray-200"
                    : "bg-red-50 border-2 border-red-500"
                  : notif.seen
                    ? "bg-gray-100 border-gray-200"
                    : "bg-orange-50 border-2 border-orange-300"
              }`}
            >
              {/* Unseen Badge */}
              {!notif.seen && (
                <View
                  className={`absolute top-3 right-3 rounded-full w-3 h-3 ${
                    notif.isExpired ? "bg-red-600" : "bg-red-500"
                  }`}
                />
              )}

              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 pr-6">
                  <Text
                    className={`font-semibold text-base ${
                      notif.isExpired ? "text-red-900" : "text-gray-900"
                    }`}
                  >
                    {notif.itemName}
                  </Text>
                  <Text
                    className={`text-sm mt-2 ${
                      notif.isExpired
                        ? notif.seen
                          ? "text-gray-600"
                          : "text-red-700 font-semibold"
                        : notif.seen
                          ? "text-gray-600"
                          : "text-orange-700 font-semibold"
                    }`}
                  >
                    {notif.message}
                  </Text>
                  <Text
                    className={`text-xs mt-2 ${
                      notif.isExpired ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {notif.isExpired
                      ? "⏰ EXPIRED"
                      : `⏱️ ${notif.daysRemaining} day${
                          notif.daysRemaining !== 1 ? "s" : ""
                        } left`}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2 mt-3">
                {!notif.seen && (
                  <TouchableOpacity
                    className="bg-green-600 rounded-full px-4 py-2 flex-1"
                    onPress={() => markAsSeen(notif.id)}
                  >
                    <Text className="text-white font-semibold text-center text-sm">
                      Mark Seen
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  className={`${notif.seen ? "bg-gray-300" : "bg-red-500"} rounded-full px-4 py-2 flex-1`}
                  onPress={() => deleteNotification(notif.id)}
                >
                  <Text className="text-white font-semibold text-center text-sm">
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
