import { useAuth } from "@/hooks/useAuth";
import { db } from "@/services/firebaseConfig";
import { scheduleStockReminder, showToast } from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  CollectionReference,
  doc,
  DocumentData,
  onSnapshot as firestoreOnSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Wrapper for Firestore's onSnapshot to match the expected signature
function onSnapshot(
  listsRef: CollectionReference<DocumentData, DocumentData>,
  callback: (listsSnap: any) => void,
) {
  return firestoreOnSnapshot(listsRef, callback);
}

export default function AddStock() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<string>("");
  const [unit, setUnit] = useState("");
  const [durationDays, setDurationDays] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Error states for inline validation
  const [nameError, setNameError] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [unitError, setUnitError] = useState("");
  const [durationError, setDurationError] = useState("");

  // List selection modal state
  const [showListModal, setShowListModal] = useState(false);
  const [pendingStockData, setPendingStockData] = useState<any>(null);

  // Add lists state and selectedListId state
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [listItems, setListItems] = useState<any[]>([]);

  const handleBack = () => {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(dashboard)/home");
    }
  };

  // Fetch lists from Firestore
  useEffect(() => {
    if (!user) return;
    const listsRef = collection(db, "users", user.uid, "lists");
    const unsubscribe = onSnapshot(listsRef, (snapshot) => {
      setLists(
        snapshot.docs.map((doc: any) => ({
          id: doc.id,
          name: doc.data().name || "Unnamed List",
        })),
      );
    });
    return unsubscribe;
  }, [user]);

  // Fetch items from selected list
  useEffect(() => {
    if (!user || !selectedListId) {
      setListItems([]);
      return;
    }
    const itemsRef = collection(
      db,
      "users",
      user.uid,
      "lists",
      selectedListId,
      "items",
    );
    const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
      const items = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setListItems(items);
    });
    return unsubscribe;
  }, [user, selectedListId]);

  const selectItemFromList = (item: any) => {
    setName(item.name || "");
    setQuantity(item.quantity?.toString() || "1");
    setUnit(item.unit || "units");
    const days = item.expectedDurationDays || 30;
    setDurationDays(days.toString());
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    setSelectedDate(futureDate);
    showToast("success", "Item loaded", `${item.name} details filled`);
  };

  const clearForm = () => {
    setName("");
    setQuantity("");
    setUnit("units");
    setDurationDays("");
    setSelectedDate(new Date());
    setSelectedListId(null);
    setNameError("");
    setQuantityError("");
    setUnitError("");
    setDurationError("");
    showToast("info", "Form cleared", "All fields have been reset");
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const today = new Date();
    const diffMs = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    setDurationDays(Math.max(1, diffDays).toString());
    setDatePickerVisible(false);
  };

  const saveStock = async () => {
    // Clear all previous errors
    setNameError("");
    setQuantityError("");
    setUnitError("");
    setDurationError("");

    let hasError = false;

    if (!user) {
      showToast("error", "Not logged in", "Please log in to add stock items");
      return;
    }

    // Validate item name
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Item name is required (e.g. Rice, Milk, Eggs)");
      hasError = true;
    }

    // Validate quantity
    if (!quantity || quantity.trim() === "") {
      setQuantityError("Quantity is required (e.g. 5, 2.5)");
      hasError = true;
    } else {
      const qty = Number(quantity);
      if (isNaN(qty)) {
        setQuantityError("Must be a valid number (e.g. 5, 2.5, 10)");
        hasError = true;
      } else if (qty <= 0) {
        setQuantityError("Must be greater than zero");
        hasError = true;
      }
    }

    // Validate unit
    if (!unit || unit.trim() === "") {
      setUnitError("Unit is required (e.g. kg, liters, packs, pieces)");
      hasError = true;
    }

    // Validate duration
    if (!durationDays || durationDays.trim() === "") {
      setDurationError(
        "Duration is required. Select an expiry date or enter days",
      );
      hasError = true;
    } else {
      const days = Number(durationDays);
      if (isNaN(days)) {
        setDurationError("Must be a valid number of days (e.g. 7, 30, 90)");
        hasError = true;
      } else if (days <= 0) {
        setDurationError("Duration must be at least 1 day");
        hasError = true;
      } else if (days > 3650) {
        setDurationError("Duration cannot exceed 10 years (3650 days)");
        hasError = true;
      }
    }

    // Validate expiry date is not in the past
    const now = new Date();
    if (selectedDate < now) {
      setDurationError(
        "Expiry date cannot be in the past. Select a future date",
      );
      hasError = true;
    }

    // Stop if there are any errors
    if (hasError) {
      showToast(
        "error",
        "Please fix the errors",
        "Check the fields marked in red",
      );
      return;
    }

    const qty = Number(quantity);
    const days = Number(durationDays);

    // Store pending data and show list selection modal
    setPendingStockData({
      trimmed,
      qty,
      days,
    });
    setShowListModal(true);
  };

  const confirmSaveStock = async () => {
    if (!user || !pendingStockData) return;

    const { trimmed, qty, days } = pendingStockData;

    try {
      setSaving(true);
      const now = new Date();
      const depletion = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const remindDaysBefore = Math.min(2, days); // remind at most 2 days before
      const remindAt = new Date(
        depletion.getTime() - remindDaysBefore * 24 * 60 * 60 * 1000,
      );

      const stockRef = collection(db, "users", user.uid, "stock");
      const docRef = await addDoc(stockRef, {
        name: trimmed,
        quantity: qty,
        unit,
        expectedDurationDays: days,
        startDate: serverTimestamp(),
        depletionDate: Timestamp.fromDate(depletion),
        reminderScheduledAt: Timestamp.fromDate(remindAt),
        reminderId: null,
      });

      // If a list was selected, also add/update the item in that list
      if (selectedListId) {
        try {
          const itemsRef = collection(
            db,
            "users",
            user.uid,
            "lists",
            selectedListId,
            "items",
          );

          // Check if item already exists in the list
          const existingItem = listItems.find(
            (item) => item.name.toLowerCase() === trimmed.toLowerCase(),
          );

          if (existingItem) {
            // Update existing item
            const itemDocRef = doc(
              db,
              "users",
              user.uid,
              "lists",
              selectedListId,
              "items",
              existingItem.id,
            );
            await updateDoc(itemDocRef, {
              stockAdded: true,
              quantity: qty,
              unit,
              expectedDurationDays: days,
            });
          } else {
            // Create new item in list
            await addDoc(itemsRef, {
              name: trimmed,
              quantity: qty,
              unit,
              expectedDurationDays: days,
              completedCount: 0,
              isLiked: false,
              stockAdded: true,
            });
          }
        } catch (listError) {
          console.error("Failed to update list:", listError);
          // Don't fail the stock save if list update fails
        }
      }

      const reminderId = await scheduleStockReminder(trimmed, remindAt);
      if (reminderId) {
        // best-effort update with reminderId
        // avoid blocking UX if it fails
        try {
          // Firestore lite update without read
          await (
            await import("firebase/firestore")
          ).updateDoc(docRef, { reminderId });
        } catch {}
      }

      showToast(
        "success",
        "Stock added",
        `${trimmed} tracked for ${days} days`,
      );
      router.push("/(dashboard)/stock-goods");
    } catch (e: any) {
      console.error("Stock save error:", e);
      let errorMessage =
        "Unable to save stock. Please check your connection and try again.";

      if (e.message?.includes("permission")) {
        errorMessage =
          "You don't have permission to add stock. Please log in again.";
      } else if (e.message?.includes("network")) {
        errorMessage =
          "Network error. Check your internet connection and try again.";
      } else if (e.message?.includes("invalid")) {
        errorMessage =
          "Invalid data entered. Please verify all fields are correct.";
      }

      showToast("error", "Unable to Save Stock", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-green-600 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handleBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Add Stock</Text>
        </View>
      </View>

      <ScrollView className="mt-8 px-6">
        <Text className="text-gray-900 font-semibold mb-2">Item Name</Text>
        <TextInput
          className={`bg-white border rounded-xl p-4 ${
            nameError ? "border-red-500" : "border-gray-200"
          }`}
          placeholder="e.g. Rice"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (nameError) setNameError("");
          }}
        />
        {nameError ? (
          <Text className="text-red-500 text-sm mt-1 ml-1">{nameError}</Text>
        ) : null}

        <View className="mt-4">
          <Text className="text-gray-900 font-semibold mb-2">Quantity</Text>
          <TextInput
            className={`bg-white border rounded-xl p-4 ${
              quantityError ? "border-red-500" : "border-gray-200"
            }`}
            placeholder="e.g. 5"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            value={quantity}
            onChangeText={(text) => {
              setQuantity(text);
              if (quantityError) setQuantityError("");
            }}
          />
          {quantityError ? (
            <Text className="text-red-500 text-sm mt-1 ml-1">
              {quantityError}
            </Text>
          ) : null}
        </View>

        <View className="mt-4">
          <Text className="text-gray-900 font-semibold mb-2">Unit</Text>
          <TextInput
            className={`bg-white border rounded-xl p-4 ${
              unitError ? "border-red-500" : "border-gray-200"
            }`}
            placeholder="kg, L, pcs, packs, bottles, boxes"
            placeholderTextColor="#9ca3af"
            value={unit}
            onChangeText={(text) => {
              setUnit(text);
              if (unitError) setUnitError("");
            }}
          />
          {unitError ? (
            <Text className="text-red-500 text-sm mt-1 ml-1">{unitError}</Text>
          ) : null}
        </View>

        <View className="mt-4">
          <Text className="text-gray-900 font-semibold mb-2">
            Select from Your Lists
          </Text>
          {lists.length === 0 ? (
            <View className="bg-gray-100 rounded-xl p-4">
              <Text className="text-gray-500 text-center">
                No lists available
              </Text>
            </View>
          ) : (
            <View className="bg-white border border-gray-200 rounded-xl p-3">
              <Text className="text-gray-600 text-sm mb-2">Choose a list:</Text>
              <ScrollView className="max-h-32 mb-2">
                {lists.map((list) => (
                  <TouchableOpacity
                    key={list.id}
                    className="flex-row justify-between items-center py-2 px-2 rounded-lg"
                    style={{
                      backgroundColor:
                        selectedListId === list.id ? "#dcfce7" : "transparent",
                    }}
                    onPress={() => setSelectedListId(list.id)}
                  >
                    <Text className="text-gray-900">{list.name}</Text>
                    <Ionicons
                      name={
                        selectedListId === list.id
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={20}
                      color="#16a34a"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {selectedListId && (
                <View className="mt-2 pt-2 border-t border-gray-200">
                  <Text className="text-gray-600 text-sm mb-2">
                    Items in this list:
                  </Text>
                  {listItems.length === 0 ? (
                    <Text className="text-gray-400 text-sm">
                      No items in this list
                    </Text>
                  ) : (
                    <ScrollView className="max-h-32">
                      {listItems.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          className="bg-green-50 rounded-lg p-3 mb-2 border border-green-200"
                          onPress={() => selectItemFromList(item)}
                        >
                          <Text className="text-gray-900 font-semibold">
                            {item.name}
                          </Text>
                          <Text className="text-gray-500 text-xs mt-1">
                            {item.quantity || 1} {item.unit || "units"} •{" "}
                            {item.expectedDurationDays || 30} days
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        <View className="mt-4">
          <Text className="text-gray-900 font-semibold mb-2">
            Expected Duration (days)
          </Text>
          <TouchableOpacity
            className={`bg-white border rounded-xl p-4 flex-row items-center justify-between ${
              durationError ? "border-red-500" : "border-gray-200"
            }`}
            onPress={() => {
              setDatePickerVisible(true);
              if (durationError) setDurationError("");
            }}
          >
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">
                {durationDays ? `${durationDays} days` : "Select expiry date"}
              </Text>
              <Text className="text-gray-500 text-xs mt-1">
                {selectedDate.toDateString()}
              </Text>
            </View>
            <Ionicons name="calendar-outline" size={24} color="#16a34a" />
          </TouchableOpacity>
          {durationError ? (
            <Text className="text-red-500 text-sm mt-1 ml-1">
              {durationError}
            </Text>
          ) : null}
        </View>

        <Modal visible={datePickerVisible} transparent animationType="slide">
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold">Select Expiry Date</Text>
                <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                  <Ionicons name="close" size={24} color="gray" />
                </TouchableOpacity>
              </View>
              <View className="items-center bg-gray-100 rounded-xl p-4">
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, date) => {
                    if (date) setSelectedDate(date);
                  }}
                  minimumDate={new Date()}
                  textColor="#000000"
                />
              </View>
              <TouchableOpacity
                className="bg-green-600 rounded-xl p-4 items-center mt-4"
                onPress={() => handleDateSelect(selectedDate)}
              >
                <Text className="text-white font-semibold">Set Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View className="flex-row gap-3 mt-6">
          <TouchableOpacity
            className="flex-1 bg-gray-500 rounded-xl p-4 items-center"
            onPress={clearForm}
          >
            <Text className="text-white font-semibold">Clear Form</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-green-600 rounded-xl p-4 items-center"
            onPress={saveStock}
            disabled={saving}
          >
            <Text className="text-white font-semibold">
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* List Selection Modal */}
      <Modal visible={showListModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold">Select List</Text>
              <TouchableOpacity onPress={() => setShowListModal(false)}>
                <Ionicons name="close" size={24} color="gray" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 text-sm mb-3">
              Which list do you want to save this item to?
            </Text>

            <ScrollView className="max-h-64 mb-4">
              <TouchableOpacity
                className="flex-row justify-between items-center py-3 px-3 rounded-lg mb-2"
                style={{
                  backgroundColor:
                    selectedListId === null ? "#dcfce7" : "transparent",
                }}
                onPress={() => setSelectedListId(null)}
              >
                <Text className="text-gray-900">No List (Stock Only)</Text>
                <Ionicons
                  name={
                    selectedListId === null
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color="#16a34a"
                />
              </TouchableOpacity>

              {lists.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  className="flex-row justify-between items-center py-3 px-3 rounded-lg mb-2"
                  style={{
                    backgroundColor:
                      selectedListId === list.id ? "#dcfce7" : "transparent",
                  }}
                  onPress={() => setSelectedListId(list.id)}
                >
                  <Text className="text-gray-900">{list.name}</Text>
                  <Ionicons
                    name={
                      selectedListId === list.id
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color="#16a34a"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-500 rounded-xl p-4 items-center"
                onPress={() => {
                  setShowListModal(false);
                  setPendingStockData(null);
                }}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-green-600 rounded-xl p-4 items-center"
                onPress={() => {
                  setShowListModal(false);
                  confirmSaveStock();
                }}
              >
                <Text className="text-white font-semibold">Save to Stock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
