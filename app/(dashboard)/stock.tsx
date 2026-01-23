import { useAuth } from "@/hooks/useAuth";
import { db } from "@/services/firebaseConfig";
import {
  cancelReminder,
  createStockNotification,
  scheduleStockReminder,
  showToast,
} from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

type StockItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expectedDurationDays: number;
  startDate?: Timestamp;
  depletionDate?: Timestamp;
  reminderScheduledAt?: Timestamp;
  reminderId?: string | null;
};

export default function Stock() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<StockItem[]>([]);

  const daysRemaining = (it: StockItem) => {
    if (!it.depletionDate) return null;
    const dep = it.depletionDate.toDate().getTime();
    const now = Date.now();
    return Math.ceil((dep - now) / (24 * 60 * 60 * 1000));
  };

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "stock");
    const unsub = onSnapshot(ref, (snap) => {
      const arr: StockItem[] = [];
      snap.forEach((d) => {
        const item = { id: d.id, ...(d.data() as any) } as StockItem;
        arr.push(item);

        const daysLeft = daysRemaining(item);

        // Create notification when stock has EXPIRED (daysRemaining <= 0)
        if (daysLeft !== null && daysLeft <= 0) {
          createStockNotification(
            user.uid,
            item.id,
            item.name,
            daysLeft,
            true, // isExpired flag
          );
        }
        // Create notification when stock is RUNNING OUT (less than 1 day remaining)
        else if (daysLeft !== null && daysLeft < 1 && daysLeft > 0) {
          createStockNotification(
            user.uid,
            item.id,
            item.name,
            daysLeft,
            false,
          );
        }
      });
      setItems(arr);
    });
    return () => unsub();
  }, [user]);

  const restock = async (item: StockItem) => {
    if (!user) return;
    try {
      const now = new Date();
      const depletion = new Date(
        now.getTime() + item.expectedDurationDays * 24 * 60 * 60 * 1000,
      );
      const remindDaysBefore = Math.min(2, item.expectedDurationDays);
      const remindAt = new Date(
        depletion.getTime() - remindDaysBefore * 24 * 60 * 60 * 1000,
      );

      const itemRef = doc(db, "users", user.uid, "stock", item.id);
      await updateDoc(itemRef, {
        startDate: Timestamp.fromDate(now),
        depletionDate: Timestamp.fromDate(depletion),
        reminderScheduledAt: Timestamp.fromDate(remindAt),
      });

      if (item.reminderId) await cancelReminder(item.reminderId);
      const newId = await scheduleStockReminder(item.name, remindAt);
      if (newId) await updateDoc(itemRef, { reminderId: newId });

      showToast("success", "Restocked", `${item.name} tracking restarted`);
    } catch (e: any) {
      showToast("error", "Failed", e.message);
    }
  };

  const deleteStock = (item: StockItem) => {
    Alert.alert(
      "Delete Item",
      `Are you sure you want to remove ${item.name} from your stock?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (item.reminderId) await cancelReminder(item.reminderId);
              await deleteDoc(doc(db, "users", user!.uid, "stock", item.id));
              showToast(
                "success",
                "Deleted",
                `${item.name} removed from stock`,
              );
            } catch (e: any) {
              showToast("error", "Failed", e.message);
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-green-600 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">⚠️ Low Stock</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 mt-4">
        {items.length === 0 ? (
          <View className="items-center mt-20">
            <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-lg">
              No stock items yet
            </Text>
          </View>
        ) : (
          (() => {
            const lowStockItems = items.filter((it) => {
              const rem = daysRemaining(it);
              return (
                rem !== null && rem <= Math.min(2, it.expectedDurationDays)
              );
            });

            if (lowStockItems.length === 0) {
              return (
                <View className="items-center mt-20">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={64}
                    color="#10b981"
                  />
                  <Text className="text-gray-600 mt-4 text-lg font-semibold">
                    All Stock OK
                  </Text>
                  <Text className="text-gray-500 mt-2 text-center px-6">
                    No low stock items. Your inventory is well-stocked!
                  </Text>
                </View>
              );
            }

            return lowStockItems.map((it) => {
              const rem = daysRemaining(it);
              return (
                <View
                  key={it.id}
                  className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-4 shadow-sm"
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-900 font-semibold text-lg">
                      {it.name}
                    </Text>
                    <Text className="text-red-600 font-bold text-base">
                      ⚠️ LOW
                    </Text>
                  </View>
                  <Text className="text-gray-600 mt-1">
                    {it.quantity} {it.unit}
                  </Text>
                  <Text className="text-red-600 mt-1 font-semibold">
                    {rem === null
                      ? "Calculating..."
                      : `${rem} day${rem !== 1 ? "s" : ""} remaining`}
                  </Text>
                  <View className="flex-row justify-between gap-2 mt-3">
                    <TouchableOpacity
                      className="bg-green-600 rounded-full px-4 py-2 flex-1"
                      onPress={() => restock(it)}
                    >
                      <Text className="text-white font-semibold text-center">
                        Restock
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-red-500 rounded-full px-4 py-2"
                      onPress={() => deleteStock(it)}
                    >
                      <Ionicons name="trash-outline" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            });
          })()
        )}
      </ScrollView>
    </View>
  );
}
