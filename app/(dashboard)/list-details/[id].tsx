// app/(dashboard)/list-details/[id].tsx
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/services/firebaseConfig";
import { showToast } from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ListDetails() {
  const router = useRouter();
  const { id: listId } = useLocalSearchParams<{ id: string }>(); // ✅ Get dynamic id
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [listName, setListName] = useState("");

  const handleBack = () => {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(dashboard)/home");
    }
  };

  // Wait for user
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500 text-lg">Loading user...</Text>
      </View>
    );
  }

  // Wait for listId
  if (!listId) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-500 text-lg">No list selected</Text>
      </View>
    );
  }

  // Real-time listener for list and items
  useEffect(() => {
    const listRef = doc(db, "users", user.uid, "lists", listId);
    const itemsRef = collection(
      db,
      "users",
      user.uid,
      "lists",
      listId,
      "items",
    );

    const unsubscribeList = onSnapshot(listRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setListName(data?.name || "List");
      }
    });

    const unsubscribeItems = onSnapshot(itemsRef, (snapshot) => {
      const userItems: any[] = [];
      snapshot.forEach((doc) => userItems.push({ id: doc.id, ...doc.data() }));
      setItems(userItems);
    });

    return () => {
      unsubscribeList();
      unsubscribeItems();
    };
  }, [user, listId]);

  // Delete an item
  const deleteItem = (itemId: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(
              doc(db, "users", user.uid, "lists", listId, "items", itemId),
            );
            showToast("success", "Deleted", "Item deleted successfully");
          } catch (error) {
            console.error(error);
            showToast("error", "Failed", "Could not delete item");
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-green-600 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handleBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">{listName}</Text>
        </View>
        <Text className="text-green-100 mt-2 text-sm">
          {items.length} items
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 mt-4">
        {items.length === 0 ? (
          <View className="items-center mt-20">
            <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-lg">No items yet</Text>
          </View>
        ) : (
          items.map((item) => {
            return (
              <TouchableOpacity
                key={item.id}
                className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-900 font-semibold text-lg flex-1">
                    {item.name}
                  </Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity onPress={() => deleteItem(item.id)}>
                      <Ionicons name="trash-outline" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text className="text-gray-600 text-sm mb-1">
                  Quantity: {item.quantity} {item.unit || "units"}
                </Text>
                {item.expectedDurationDays ? (
                  <Text className="text-gray-600 text-sm mb-1">
                    Duration: {item.expectedDurationDays} days
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
