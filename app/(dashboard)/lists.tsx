import { useAuth } from "@/hooks/useAuth";
import { db } from "@/services/firebaseConfig";
import { showToast } from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Lists() {
  const router = useRouter();
  const { user } = useAuth();
  const [lists, setLists] = useState<any[]>([]);

  const handleBack = () => {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(dashboard)/home");
    }
  };

  // Early return if user not loaded yet
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500 text-lg">Loading user...</Text>
      </View>
    );
  }

  // Real-time lists with per-list item counts
  useEffect(() => {
    const listsRef = collection(db, "users", user.uid, "lists");

    // Track item listeners for cleanup
    let itemUnsubs: Array<() => void> = [];

    const unsubLists = onSnapshot(
      listsRef,
      (snapshot) => {
        // Remove old item listeners before re-attaching
        itemUnsubs.forEach((fn) => fn());
        itemUnsubs = [];

        if (snapshot.empty) {
          setLists([]);
          return;
        }

        // Seed lists without counts
        const base = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
          itemCount: 0,
        }));
        setLists(base);

        // Attach item listeners per list to keep counts fresh
        snapshot.docs.forEach((d) => {
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
              setLists((prev) =>
                prev.map((lst) =>
                  lst.id === d.id ? { ...lst, itemCount: itemsSnap.size } : lst,
                ),
              );
            },
            (error) => console.warn("Items listener error:", error.message),
          );

          itemUnsubs.push(unsubItems);
        });
      },
      (error) => {
        console.error("Failed to fetch lists:", error);
        showToast("error", "Error", "Could not fetch lists");
      },
    );

    return () => {
      unsubLists();
      itemUnsubs.forEach((fn) => fn());
    };
  }, [user]);

  // Delete a list
  const deleteList = (listId: string) => {
    if (!user) return;
    Alert.alert("Delete List", "Are you sure you want to delete this list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "users", user.uid, "lists", listId));
            showToast("success", "Deleted", "List deleted successfully");
          } catch (error) {
            console.error(error);
            showToast("error", "Failed", "Could not delete list");
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
          <Text className="text-white text-2xl font-bold">
            📋 My Grocery Lists
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 mt-4"
        showsVerticalScrollIndicator={false}
      >
        {lists.length === 0 ? (
          <View className="items-center mt-20">
            <Ionicons name="list-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-lg">
              No grocery lists yet
            </Text>
          </View>
        ) : (
          lists.map((list) => {
            return (
              <TouchableOpacity
                key={list.id}
                className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
                onPress={() =>
                  router.push({
                    pathname: "/(dashboard)/list-details/[id]",
                    params: { id: list.id },
                  })
                }
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-900 font-semibold text-lg flex-1">
                    {list.name}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600 text-sm">
                    {list.itemCount} items
                  </Text>
                  <TouchableOpacity
                    className="bg-red-100 rounded-full px-3 py-1"
                    onPress={() => deleteList(list.id)}
                  >
                    <Text className="text-red-700 font-semibold text-xs">
                      Delete 🗑️
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
