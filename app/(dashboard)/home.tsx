import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { showToast, showConfirmation } from "@/utils/notifications";

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with Firebase later
  const [groceryLists, setGroceryLists] = useState([
    { id: "1", name: "Weekly Shopping", itemCount: 12, completedCount: 8 },
    { id: "2", name: "Party Supplies", itemCount: 5, completedCount: 0 },
  ]);

  const [lowStockItems, setLowStockItems] = useState([
    { id: "1", name: "Rice", quantity: "500g", daysLeft: 2 },
    { id: "2", name: "Milk", quantity: "1L", daysLeft: 1 },
    { id: "3", name: "Eggs", quantity: "6 pcs", daysLeft: 3 },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch updated data from Firebase
    setTimeout(() => {
      setRefreshing(false);
      showToast("success", "Refreshed", "Data updated successfully");
    }, 1000);
  };

  const handleLogout = () => {
    showConfirmation(
      "Logout",
      "Are you sure you want to logout?",
      async () => {
        await logout();
        router.replace("/(auth)/login");
      }
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-green-600 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-white text-2xl font-bold">SmartGrocer 🛒</Text>
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
            <Text className="text-white text-3xl font-bold">{groceryLists.length}</Text>
            <Text className="text-green-100 text-sm mt-1">Active Lists</Text>
          </View>
          <View className="bg-white/20 rounded-2xl p-4 flex-1 ml-2">
            <Text className="text-white text-3xl font-bold">{lowStockItems.length}</Text>
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
              <Text className="text-xl font-bold text-gray-900">⚠️ Low Stock Items</Text>
              <TouchableOpacity onPress={() => router.push("/(dashboard)/stock")}>
                <Text className="text-green-600 font-semibold">View All</Text>
              </TouchableOpacity>
            </View>

            {lowStockItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-3 flex-row justify-between items-center"
                onPress={() => showToast("info", "Stock Alert", `${item.name} is running low`)}
              >
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-base">{item.name}</Text>
                  <Text className="text-gray-600 text-sm mt-1">Remaining: {item.quantity}</Text>
                </View>
                <View className="bg-orange-500 rounded-full px-3 py-1">
                  <Text className="text-white font-bold text-xs">{item.daysLeft}d left</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* My Grocery Lists */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-bold text-gray-900">📋 My Grocery Lists</Text>
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
                <Text className="text-gray-900 font-semibold text-base flex-1">{list.name}</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>

              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-gray-600 text-sm">
                  {list.completedCount}/{list.itemCount} items completed
                </Text>
                <View className="bg-green-100 rounded-full px-3 py-1">
                  <Text className="text-green-700 font-semibold text-xs">
                    {Math.round((list.completedCount / list.itemCount) * 100)}%
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View className="mt-3 bg-gray-200 h-2 rounded-full overflow-hidden">
                <View
                  className="bg-green-500 h-full"
                  style={{
                    width: `${(list.completedCount / list.itemCount) * 100}%`,
                  }}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-900 mb-3">⚡ Quick Actions</Text>

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
              onPress={() => router.push("/(dashboard)/shopping-mode")}
            >
              <Ionicons name="cart-outline" size={32} color="white" />
              <Text className="text-white font-semibold mt-2">Shopping</Text>
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
