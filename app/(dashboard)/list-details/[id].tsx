// app/(dashboard)/list-details/[id].tsx
import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/services/firebaseConfig";
import { collection, doc, onSnapshot, updateDoc, deleteDoc, addDoc, increment } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { showToast } from "@/utils/notifications";

export default function ListDetails() {
  const router = useRouter();
  const { id: listId } = useLocalSearchParams<{ id: string }>(); // ✅ Get dynamic id
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [listName, setListName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

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
    const itemsRef = collection(db, "users", user.uid, "lists", listId, "items");

    const unsubscribeList = onSnapshot(listRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setListName(data?.name || "List");
      }
    });

    const unsubscribeItems = onSnapshot(itemsRef, snapshot => {
      const userItems: any[] = [];
      snapshot.forEach(doc => userItems.push({ id: doc.id, ...doc.data() }));
      setItems(userItems);
    });

    return () => {
      unsubscribeList();
      unsubscribeItems();
    };
  }, [user, listId]);

  // Mark item as completed
  const markItemCompleted = async (itemId: string, completedCount: number, quantity: number) => {
    if (completedCount >= quantity) {
      showToast("info", "Already Completed", "This item is already completed");
      return;
    }
    try {
      const itemRef = doc(db, "users", user.uid, "lists", listId, "items", itemId);
      await updateDoc(itemRef, { completedCount: increment(1) });
      showToast("success", "Updated", "Item marked completed");
    } catch (error) {
      console.error(error);
      showToast("error", "Failed", "Could not update item");
    }
  };

  // Delete an item
  const deleteItem = (itemId: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "users", user.uid, "lists", listId, "items", itemId));
            showToast("success", "Deleted", "Item deleted successfully");
          } catch (error) {
            console.error(error);
            showToast("error", "Failed", "Could not delete item");
          }
        },
      },
    ]);
  };

  // Add new item
  const addNewItem = async () => {
    if (!newItemName.trim()) return;
    try {
      const itemsRef = collection(db, "users", user.uid, "lists", listId, "items");
      await addDoc(itemsRef, { name: newItemName, completedCount: 0, quantity: 1 });
      setNewItemName("");
      setModalVisible(false);
      showToast("success", "Added", "Item added successfully");
    } catch (error) {
      console.error(error);
      showToast("error", "Failed", "Could not add item");
    }
  };

  const totalItems = items.length;
  const completedItems = items.reduce((sum, item) => sum + (item.completedCount || 0), 0);
  const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-green-600 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">{listName}</Text>
        </View>
        <View className="mt-4 bg-green-100 h-2 rounded-full overflow-hidden">
          <View className="bg-green-600 h-full" style={{ width: `${progress}%` }} />
        </View>
        <Text className="text-green-700 mt-1">{progress}% completed</Text>
      </View>

      <ScrollView className="flex-1 px-6 mt-4">
        {items.length === 0 ? (
          <View className="items-center mt-20">
            <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-lg">No items yet</Text>
          </View>
        ) : (
          items.map(item => {
            const itemProgress = item.quantity === 0 ? 0 : Math.round((item.completedCount / item.quantity) * 100);
            return (
              <TouchableOpacity key={item.id} className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-900 font-semibold text-lg flex-1">{item.name}</Text>
                  <Ionicons name="trash-outline" size={20} color="red" onPress={() => deleteItem(item.id)} />
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600 text-sm">{item.completedCount}/{item.quantity} completed</Text>
                  <TouchableOpacity className="bg-green-100 rounded-full px-3 py-1" onPress={() => markItemCompleted(item.id, item.completedCount, item.quantity)}>
                    <Text className="text-green-700 font-semibold text-xs">{itemProgress}% ✅</Text>
                  </TouchableOpacity>
                </View>
                <View className="mt-3 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <View className="bg-green-500 h-full" style={{ width: `${itemProgress}%` }} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-xl p-6 w-80">
            <Text className="text-lg font-bold mb-2">Add New Item</Text>
            <TextInput
              placeholder="Item Name"
              className="border border-gray-300 rounded p-2 mb-4"
              value={newItemName}
              onChangeText={setNewItemName}
            />
            <View className="flex-row justify-end">
              <TouchableOpacity className="mr-2" onPress={() => setModalVisible(false)}>
                <Text className="text-gray-500">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addNewItem}>
                <Text className="text-green-600 font-semibold">Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Add Button */}
      <TouchableOpacity className="absolute bottom-6 right-6 bg-green-600 rounded-full w-16 h-16 items-center justify-center shadow-lg" onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}
