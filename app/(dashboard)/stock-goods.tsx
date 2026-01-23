import { useAuth } from "@/hooks/useAuth";
import { db } from "@/services/firebaseConfig";
import {
  cancelReminder,
  showConfirmation,
  showToast,
} from "@/utils/notifications";
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
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ItemWithDetails = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  quantity: number;
  unit: string;
  completedCount: number;
  expectedDurationDays: number;
  isLiked: boolean;
  stockAdded: boolean;
  listName?: string;
  listId?: string;
};

type StockItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expectedDurationDays: number;
  depletionDate?: any;
  startDate?: any;
  reminderScheduledAt?: any;
  reminderId?: string | null;
};

export default function StockGoods() {
  const router = useRouter();
  const { user } = useAuth();
  const [allItems, setAllItems] = useState<ItemWithDetails[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  const handleBack = () => {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(dashboard)/home");
    }
  };

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editDuration, setEditDuration] = useState("");

  // Normalize names for consistent matching
  const normalizeName = (v: string) => v?.trim().toLowerCase() || "";

  useEffect(() => {
    if (!user) return;

    const listsRef = collection(db, "users", user.uid, "lists");
    const stockRef = collection(db, "users", user.uid, "stock");

    // Keep track of item-level listeners so we can cleanly re-attach on list changes
    let itemUnsubs: Array<() => void> = [];

    const unsubLists = onSnapshot(listsRef, (listsSnap) => {
      // Clear previous item listeners before re-subscribing
      itemUnsubs.forEach((fn) => fn());
      itemUnsubs = [];

      if (listsSnap.empty) {
        setAllItems([]);
        return;
      }

      listsSnap.docs.forEach((listDoc) => {
        const listData = listDoc.data();
        const listName = listData.name || "Unnamed List";
        const itemsRef = collection(
          db,
          "users",
          user.uid,
          "lists",
          listDoc.id,
          "items",
        );

        const unsubItems = onSnapshot(itemsRef, (itemsSnap) => {
          const listItems = itemsSnap.docs.map(
            (itemDoc) =>
              ({
                id: itemDoc.id,
                listId: listDoc.id,
                listName,
                ...itemDoc.data(),
              }) as ItemWithDetails,
          );

          // Merge items from this list with all other lists
          setAllItems((prev) => {
            const others = prev.filter((i) => i.listId !== listDoc.id);
            return [...others, ...listItems];
          });
        });

        itemUnsubs.push(unsubItems);
      });
    });

    const unsubStock = onSnapshot(stockRef, (snap) => {
      const stock: StockItem[] = [];
      snap.forEach((d) => stock.push({ id: d.id, ...d.data() } as StockItem));
      setStockItems(stock);
    });

    return () => {
      unsubLists();
      unsubStock();
      itemUnsubs.forEach((fn) => fn());
    };
  }, [user]);

  const getStockInfo = (itemName: string) => {
    return stockItems.find((s) => s.name === itemName);
  };

  const getListsForItem = (itemName: string) => {
    return allItems
      .filter((i) => i.name === itemName)
      .map((i) => ({ listName: i.listName, listId: i.listId }))
      .filter(
        (item, index, self) =>
          index === self.findIndex((i) => i.listId === item.listId),
      );
  };

  const daysRemaining = (stockItem?: StockItem) => {
    if (!stockItem?.depletionDate) return null;
    const dep = stockItem.depletionDate.toDate().getTime();
    const now = Date.now();
    return Math.ceil((dep - now) / (24 * 60 * 60 * 1000));
  };

  // Edit stock item
  const openEditStockModal = (stockItem: StockItem) => {
    setEditingItem({ ...stockItem, type: "stock" });
    setEditName(stockItem.name);
    setEditQuantity(String(stockItem.quantity));
    setEditUnit(stockItem.unit);
    setEditDuration(String(stockItem.expectedDurationDays));
    setEditModalVisible(true);
  };

  // Edit list item
  const openEditListItemModal = (listItem: ItemWithDetails) => {
    setEditingItem({ ...listItem, type: "listItem" });
    setEditName(listItem.name);
    setEditQuantity(String(listItem.quantity));
    setEditUnit(listItem.unit || "units");
    setEditDuration(String(listItem.expectedDurationDays));
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!user || !editingItem) return;

    const trimmedName = editName.trim();
    const qty = parseInt(editQuantity) || 1;
    const dur = parseInt(editDuration) || 7;

    if (!trimmedName) {
      showToast("error", "Name required");
      return;
    }

    try {
      if (editingItem.type === "stock") {
        const stockRef = doc(db, "users", user.uid, "stock", editingItem.id);
        await updateDoc(stockRef, {
          name: trimmedName,
          quantity: qty,
          unit: editUnit,
          expectedDurationDays: dur,
        });
        showToast("success", "Stock updated");
      } else if (editingItem.type === "listItem") {
        const itemRef = doc(
          db,
          "users",
          user.uid,
          "lists",
          editingItem.listId,
          "items",
          editingItem.id,
        );
        await updateDoc(itemRef, {
          name: trimmedName,
          quantity: qty,
          unit: editUnit,
          expectedDurationDays: dur,
        });
        showToast("success", "Item updated");
      }
      setEditModalVisible(false);
    } catch (e: any) {
      showToast("error", "Update failed", e.message);
    }
  };

  // Delete stock item
  const deleteStockItem = (stockItem: StockItem) => {
    showConfirmation(
      "Delete Stock",
      `Remove ${stockItem.name} from stock?`,
      async () => {
        if (!user) return;
        try {
          if (stockItem.reminderId) {
            await cancelReminder(stockItem.reminderId);
          }
          await deleteDoc(doc(db, "users", user.uid, "stock", stockItem.id));
          showToast("success", "Deleted", `${stockItem.name} removed`);
        } catch (e: any) {
          showToast("error", "Delete failed", e.message);
        }
      },
    );
  };

  // Delete list item
  const deleteListItem = (listItem: ItemWithDetails) => {
    showConfirmation(
      "Delete Item",
      `Remove ${listItem.name} from ${listItem.listName}?`,
      async () => {
        if (!user || !listItem.listId) return;
        try {
          await deleteDoc(
            doc(
              db,
              "users",
              user.uid,
              "lists",
              listItem.listId,
              "items",
              listItem.id,
            ),
          );
          showToast("success", "Deleted", `${listItem.name} removed`);
        } catch (e: any) {
          showToast("error", "Delete failed", e.message);
        }
      },
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-green-600 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handleBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">📦 All Items</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 mt-4">
        {allItems.length === 0 && stockItems.length === 0 ? (
          <View className="items-center mt-20">
            <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-lg">
              No items added yet
            </Text>
          </View>
        ) : (
          <>
            {Array.from(
              new Set(
                [...allItems, ...stockItems]
                  .map((i: any) => normalizeName(i.name))
                  .filter(Boolean),
              ),
            ).map((nameKey) => {
              const listsWithThisItem = allItems
                .filter((i) => normalizeName(i.name) === nameKey)
                .map((i) => ({ listName: i.listName, listId: i.listId }))
                .filter(
                  (i, idx, self) =>
                    idx === self.findIndex((x) => x.listId === i.listId),
                );

              const stockInfo = stockItems.find(
                (s) => normalizeName(s.name) === nameKey,
              );

              const sampleItem =
                allItems.find((i) => normalizeName(i.name) === nameKey) ||
                stockInfo;

              if (!sampleItem) return null;

              const displayName = sampleItem.name || "Unnamed Item";
              const daysLeft = stockInfo ? daysRemaining(stockInfo) : null;

              const handleEdit = () => {
                if (stockInfo) openEditStockModal(stockInfo);
                else openEditListItemModal(sampleItem as ItemWithDetails);
              };

              const handleDelete = () => {
                if (stockInfo) deleteStockItem(stockInfo);
                else deleteListItem(sampleItem as ItemWithDetails);
              };

              return (
                <View
                  key={`item-${nameKey}`}
                  className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-gray-900 font-bold text-xl">
                        {displayName}
                      </Text>
                      {(sampleItem as ItemWithDetails).isLiked && (
                        <Ionicons name="heart" size={18} color="#ef4444" />
                      )}
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity onPress={handleEdit}>
                        <Ionicons
                          name="create-outline"
                          size={22}
                          color="#3b82f6"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleDelete}>
                        <Ionicons
                          name="trash-outline"
                          size={22}
                          color="#ef4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {(sampleItem as ItemWithDetails).description ? (
                    <Text className="text-gray-600 text-sm mb-3">
                      {(sampleItem as ItemWithDetails).description}
                    </Text>
                  ) : null}

                  {stockInfo ? (
                    <View className="bg-green-50 rounded-lg p-3 mb-2">
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="cube" size={16} color="#16a34a" />
                        <Text className="text-green-700 font-semibold ml-2">
                          Stock Details
                        </Text>
                      </View>
                      <View className="ml-6">
                        <Text className="text-green-600 text-sm mb-1">
                          Quantity: {stockInfo.quantity} {stockInfo.unit}
                        </Text>
                        <Text className="text-green-600 text-sm mb-1">
                          Duration: {stockInfo.expectedDurationDays} days
                        </Text>
                        {listsWithThisItem.length > 0 && (
                          <Text className="text-green-600 text-sm mb-1">
                            Lists:{" "}
                            {listsWithThisItem
                              .map((l) => l.listName)
                              .join(", ")}
                          </Text>
                        )}
                        {daysLeft !== null && (
                          <Text
                            className={`text-sm font-semibold ${
                              daysLeft <= 2 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {daysLeft <= 0
                              ? "⚠️ Depleted"
                              : `⏰ ${daysLeft} days remaining`}
                          </Text>
                        )}
                      </View>
                    </View>
                  ) : (
                    <View className="bg-gray-50 rounded-lg p-3 mb-2">
                      <View className="flex-row items-center">
                        <Ionicons
                          name="cube-outline"
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="text-gray-500 text-sm ml-2">
                          Not yet added to stock
                        </Text>
                      </View>
                      {listsWithThisItem.length > 0 && (
                        <Text className="text-gray-600 text-sm mt-2 ml-6">
                          Lists:{" "}
                          {listsWithThisItem.map((l) => l.listName).join(", ")}
                        </Text>
                      )}
                    </View>
                  )}

                  <View className="border-t border-gray-200 pt-3 mt-2">
                    <Text className="text-gray-500 text-xs mb-1">
                      Expected Duration: {sampleItem.expectedDurationDays} days
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      list name:{" "}
                      {listsWithThisItem.length > 0
                        ? listsWithThisItem.map((l) => l.listName).join(", ")
                        : "No Lists"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-xl p-6 w-full max-w-md">
            <Text className="text-xl font-bold mb-4">Edit Item</Text>

            <Text className="text-gray-700 font-semibold mb-1">Name</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              value={editName}
              onChangeText={setEditName}
              placeholder="Item name"
            />

            <Text className="text-gray-700 font-semibold mb-1">Quantity</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              value={editQuantity}
              onChangeText={setEditQuantity}
              placeholder="1"
              keyboardType="numeric"
            />

            <Text className="text-gray-700 font-semibold mb-1">Unit</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              value={editUnit}
              onChangeText={setEditUnit}
              placeholder="kg, pcs, etc."
            />

            <Text className="text-gray-700 font-semibold mb-1">
              Duration (days)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4"
              value={editDuration}
              onChangeText={setEditDuration}
              placeholder="7"
              keyboardType="numeric"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg p-3"
                onPress={() => setEditModalVisible(false)}
              >
                <Text className="text-gray-700 font-semibold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-green-600 rounded-lg p-3"
                onPress={saveEdit}
              >
                <Text className="text-white font-semibold text-center">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
