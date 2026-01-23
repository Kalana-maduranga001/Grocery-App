import { useAuth } from "@/hooks/useAuth";
import { db } from "@/services/firebaseConfig";
import {
  createStockNotification,
  showConfirmation,
  showToast,
} from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const [groceryLists, setGroceryLists] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  // Real-time fetch lists and their item counts from Firestore
  useEffect(() => {
    if (!user) return;
    const listsRef = collection(db, "users", user.uid, "lists");

    // Track per-list item listeners so we can clean them up on list changes
    let itemUnsubs: Array<() => void> = [];

    const unsubLists = onSnapshot(
      listsRef,
      (snap) => {
        // Clear previous item listeners before re-subscribing
        itemUnsubs.forEach((fn) => fn());
        itemUnsubs = [];

        if (snap.empty) {
          setGroceryLists([]);
          return;
        }

        // Seed lists without counts first
        const baseLists = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || "Untitled",
            itemCount: 0,
            completedCount: 0,
          };
        });
        setGroceryLists(baseLists);

        // Attach listeners to each list's items to keep counts fresh
        snap.docs.forEach((d) => {
          const itemsRef = collection(
            db,
            "users",
            user.uid,
            "lists",
            d.id,
            "items",
          );

          const unsubItems = onSnapshot(
            itemsRef,
            (itemsSnap) => {
              setGroceryLists((prev) =>
                prev.map((lst) =>
                  lst.id === d.id ? { ...lst, itemCount: itemsSnap.size } : lst,
                ),
              );
            },
            (error) => {
              console.warn("Items listener error:", error.message);
            },
          );

          itemUnsubs.push(unsubItems);
        });
      },
      (error) => {
        console.warn("Lists listener error:", error.message);
        // Continue gracefully on error
      },
    );

    return () => {
      unsubLists();
      itemUnsubs.forEach((fn) => fn());
    };
  }, [user]);

  // Real-time fetch stock from Firestore
  useEffect(() => {
    if (!user) return;
    const stockRef = collection(db, "users", user.uid, "stock");
    const unsub = onSnapshot(
      stockRef,
      (snap) => {
        const arr: any[] = [];
        const now = Date.now();

        console.log(
          `[HOME] Checking ${snap.size} stock items for notifications...`,
        );

        snap.forEach((d) => {
          const data = d.data();
          if (data.depletionDate) {
            const dep = (data.depletionDate as Timestamp).toDate().getTime();
            const daysLeft = Math.ceil((dep - now) / (24 * 60 * 60 * 1000));

            console.log(`[HOME] Item: ${data.name}, Days left: ${daysLeft}`);

            // Create notifications for expired or running low items
            if (daysLeft <= 0) {
              // Item has EXPIRED
              console.log(
                `[HOME] Creating EXPIRED notification for ${data.name}`,
              );
              createStockNotification(
                user.uid,
                d.id,
                data.name || "Item",
                daysLeft,
                true, // isExpired
              );
            } else if (daysLeft <= 2) {
              // Item has 2 days or less (TESTING - broader criteria)
              console.log(
                `[HOME] Creating LOW STOCK notification for ${data.name}`,
              );
              createStockNotification(
                user.uid,
                d.id,
                data.name || "Item",
                daysLeft,
                false,
              );
            }

            // Only show items with 2 days or less remaining in home screen
            if (daysLeft <= 2 && daysLeft > 0) {
              arr.push({
                id: d.id,
                name: data.name || "Item",
                quantity: `${data.quantity || 0} ${data.unit || "units"}`,
                daysLeft,
              });
            }
          }
        });

        console.log(`[HOME] Found ${arr.length} low stock items for display`);
        setLowStockItems(arr);
      },
      (error) => {
        console.warn("Stock listener error:", error.message);
        // Continue gracefully on error
      },
    );
    return () => unsub();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast("success", "Refreshed", "Data updated");
    }, 1000);
  };

  const handleLogout = () => {
    showConfirmation("Logout", "Are you sure you want to logout?", async () => {
      await logout();
      router.replace("/(auth)/login");
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-green-600 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-white text-2xl font-bold">
              SmartGrocer 🛒
            </Text>
            <Text className="text-green-100 text-sm mt-1">
              Welcome back, {user?.displayName || "User"}!
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-white/20 p-3 rounded-full"
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View className="flex-row justify-between mt-4">
          <View className="bg-white/20 rounded-2xl p-4 flex-1 mr-2">
            <Text className="text-white text-3xl font-bold">
              {groceryLists.length}
            </Text>
            <Text className="text-green-100 text-sm mt-1">Active Lists</Text>
          </View>
          <View className="bg-white/20 rounded-2xl p-4 flex-1 ml-2">
            <Text className="text-white text-3xl font-bold">
              {lowStockItems.length}
            </Text>
            <Text className="text-green-100 text-sm mt-1">Low Stock</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6 mt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xl font-bold text-gray-900">
                ⚠️ Low Stock Items
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(dashboard)/stock")}
              >
                <Text className="text-green-600 font-semibold">View All</Text>
              </TouchableOpacity>
            </View>

            {lowStockItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-3 flex-row justify-between items-center"
                onPress={() =>
                  showToast(
                    "info",
                    "Stock Alert",
                    `${item.name} is running low`,
                  )
                }
              >
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-base">
                    {item.name}
                  </Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    Remaining: {item.quantity}
                  </Text>
                </View>
                <View className="bg-orange-500 rounded-full px-3 py-1">
                  <Text className="text-white font-bold text-xs">
                    {item.daysLeft}d left
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* My Grocery Lists */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-bold text-gray-900">
              📋 My Grocery Lists
            </Text>
            <TouchableOpacity onPress={() => router.push("/(dashboard)/lists")}>
              <Text className="text-green-600 font-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          {groceryLists.map((list) => (
            <TouchableOpacity
              key={list.id}
              className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
              onPress={() =>
                router.push({
                  pathname: "/(dashboard)/list-details/[id]",
                  params: { id: list.id },
                })
              }
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-900 font-semibold text-base flex-1">
                  {list.name}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>

              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-gray-600 text-sm">
                  {list.itemCount} items
                </Text>
                <View className="bg-green-100 rounded-full px-3 py-1">
                  <Text className="text-green-700 font-semibold text-xs">
                    Active
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            ⚡ Quick Actions
          </Text>

          <View className="flex-row justify-between">
            <TouchableOpacity
              className="bg-green-600 rounded-2xl p-4 flex-1 mr-2 items-center"
              onPress={() => router.push("/(dashboard)/create-list")}
            >
              <Ionicons name="add-circle-outline" size={32} color="white" />
              <Text className="text-white font-semibold mt-2">New List</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-blue-600 rounded-2xl p-4 flex-1 ml-2 items-center"
              onPress={() => router.push("/(dashboard)/add-stock")}
            >
              <Ionicons name="cube-outline" size={32} color="white" />
              <Text className="text-white font-semibold mt-2">Add Stock</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between mt-4">
            <TouchableOpacity
              className="bg-purple-600 rounded-2xl p-4 flex-1 mr-2 items-center"
              onPress={() => router.push("/(dashboard)/stock-goods")}
            >
              <Ionicons name="cart-outline" size={32} color="white" />
              <Text className="text-white font-semibold mt-2">Stock Items</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-orange-600 rounded-2xl p-4 flex-1 ml-2 items-center"
              onPress={() => router.push("/(dashboard)/notifications")}
            >
              <Ionicons name="notifications-outline" size={32} color="white" />
              <Text className="text-white font-semibold mt-2">Reminders</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-green-600 rounded-full w-16 h-16 items-center justify-center shadow-lg"
        onPress={() => router.push("/(dashboard)/create-list")}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}
