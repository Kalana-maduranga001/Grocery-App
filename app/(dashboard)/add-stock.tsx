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
  StyleSheet,
} from "react-native";

// Common font style helper (matching home page)
const fontStyles = {
  heavy: Platform.select({
    ios: { fontFamily: "System", fontWeight: "900" as const },
    android: { fontFamily: "sans-serif-black", fontWeight: "bold" as const },
    default: { fontFamily: "System", fontWeight: "900" as const },
  }),
  bold: Platform.select({
    ios: { fontFamily: "System", fontWeight: "800" as const },
    android: { fontFamily: "sans-serif-black", fontWeight: "bold" as const },
    default: { fontFamily: "System", fontWeight: "800" as const },
  }),
  semibold: Platform.select({
    ios: { fontFamily: "System", fontWeight: "700" as const },
    android: { fontFamily: "sans-serif-medium", fontWeight: "bold" as const },
    default: { fontFamily: "System", fontWeight: "700" as const },
  }),
  medium: Platform.select({
    ios: { fontFamily: "System", fontWeight: "600" as const },
    android: { fontFamily: "sans-serif-medium" as const },
    default: { fontFamily: "System", fontWeight: "600" as const },
  }),
  regular: Platform.select({
    ios: { fontFamily: "System", fontWeight: "500" as const },
    android: { fontFamily: "sans-serif" as const },
    default: { fontFamily: "System", fontWeight: "500" as const },
  }),
};

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
      const remindDaysBefore = Math.min(2, days);
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

          const existingItem = listItems.find(
            (item) => item.name.toLowerCase() === trimmed.toLowerCase(),
          );

          if (existingItem) {
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
        }
      }

      const reminderId = await scheduleStockReminder(trimmed, remindAt);
      if (reminderId) {
        try {
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
    <View style={styles.container}>
      {/* Background Decorations */}
      <View style={styles.backgroundDecor}>
        <View style={[styles.circle, styles.circleTopLeft1]} />
        <View style={[styles.circle, styles.circleTopRight1]} />
        <View style={[styles.circle, styles.circleBottomLeft1]} />
        <View style={[styles.circle, styles.circleBottomRight1]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFE4CC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Stock</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Item Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Item Name</Text>
          <TextInput
            style={[styles.input, nameError && styles.inputError]}
            placeholder="e.g. Rice"
            placeholderTextColor="rgba(255, 228, 204, 0.4)"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError("");
            }}
          />
          {nameError ? (
            <Text style={styles.errorText}>{nameError}</Text>
          ) : null}
        </View>

        {/* Quantity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={[styles.input, quantityError && styles.inputError]}
            placeholder="e.g. 5"
            placeholderTextColor="rgba(255, 228, 204, 0.4)"
            keyboardType="numeric"
            value={quantity}
            onChangeText={(text) => {
              setQuantity(text);
              if (quantityError) setQuantityError("");
            }}
          />
          {quantityError ? (
            <Text style={styles.errorText}>{quantityError}</Text>
          ) : null}
        </View>

        {/* Unit */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Unit</Text>
          <TextInput
            style={[styles.input, unitError && styles.inputError]}
            placeholder="kg, L, pcs, packs, bottles, boxes"
            placeholderTextColor="rgba(255, 228, 204, 0.4)"
            value={unit}
            onChangeText={(text) => {
              setUnit(text);
              if (unitError) setUnitError("");
            }}
          />
          {unitError ? (
            <Text style={styles.errorText}>{unitError}</Text>
          ) : null}
        </View>

        {/* Select from Lists */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select from Your Lists</Text>
          {lists.length === 0 ? (
            <View style={styles.emptyListsContainer}>
              <Text style={styles.emptyListsText}>No lists available</Text>
            </View>
          ) : (
            <View style={styles.listsContainer}>
              <Text style={styles.listsLabel}>Choose a list:</Text>
              <ScrollView style={styles.listsScroll}>
                {lists.map((list) => (
                  <TouchableOpacity
                    key={list.id}
                    style={[
                      styles.listItem,
                      selectedListId === list.id && styles.listItemSelected,
                    ]}
                    onPress={() => setSelectedListId(list.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.listItemText}>{list.name}</Text>
                    <Ionicons
                      name={
                        selectedListId === list.id
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={20}
                      color="#FF6B00"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {selectedListId && (
                <View style={styles.listItemsContainer}>
                  <Text style={styles.listsLabel}>Items in this list:</Text>
                  {listItems.length === 0 ? (
                    <Text style={styles.noItemsText}>No items in this list</Text>
                  ) : (
                    <ScrollView style={styles.itemsScroll}>
                      {listItems.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.listItemCard}
                          onPress={() => selectItemFromList(item)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.listItemName}>{item.name}</Text>
                          <Text style={styles.listItemDetails}>
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

        {/* Duration Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expected Duration (days)</Text>
          <TouchableOpacity
            style={[styles.datePickerButton, durationError && styles.inputError]}
            onPress={() => {
              setDatePickerVisible(true);
              if (durationError) setDurationError("");
            }}
            activeOpacity={0.7}
          >
            <View style={styles.datePickerContent}>
              <View>
                <Text style={styles.datePickerText}>
                  {durationDays ? `${durationDays} days` : "Select expiry date"}
                </Text>
                <Text style={styles.datePickerSubtext}>
                  {selectedDate.toDateString()}
                </Text>
              </View>
              <Ionicons name="calendar-outline" size={24} color="#FF6B00" />
            </View>
          </TouchableOpacity>
          {durationError ? (
            <Text style={styles.errorText}>{durationError}</Text>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearForm}
            activeOpacity={0.8}
          >
            <Text style={styles.clearButtonText}>Clear Form</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveStock}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal visible={datePickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Expiry Date</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Ionicons name="close" size={24} color="#FFE4CC" />
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, date) => {
                  if (date) setSelectedDate(date);
                }}
                minimumDate={new Date()}
                textColor="#FFFFFF"
              />
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleDateSelect(selectedDate)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Set Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* List Selection Modal */}
      <Modal visible={showListModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select List</Text>
              <TouchableOpacity onPress={() => setShowListModal(false)}>
                <Ionicons name="close" size={24} color="#FFE4CC" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Which list do you want to save this item to?
            </Text>

            <ScrollView style={styles.modalListScroll}>
              <TouchableOpacity
                style={[
                  styles.modalListItem,
                  selectedListId === null && styles.modalListItemSelected,
                ]}
                onPress={() => setSelectedListId(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalListItemText}>No List (Stock Only)</Text>
                <Ionicons
                  name={
                    selectedListId === null
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color="#FF6B00"
                />
              </TouchableOpacity>

              {lists.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  style={[
                    styles.modalListItem,
                    selectedListId === list.id && styles.modalListItemSelected,
                  ]}
                  onPress={() => setSelectedListId(list.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalListItemText}>{list.name}</Text>
                  <Ionicons
                    name={
                      selectedListId === list.id
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color="#FF6B00"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.modalCancelButton]}
                onPress={() => {
                  setShowListModal(false);
                  setPendingStockData(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.clearButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={() => {
                  setShowListModal(false);
                  confirmSaveStock();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>Save to Stock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3D2417",
  },
  backgroundDecor: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "rgba(255, 107, 0, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 0, 0.12)",
  },
  circleTopLeft1: {
    top: -60,
    left: -60,
    width: 180,
    height: 180,
  },
  circleTopRight1: {
    top: -40,
    right: -40,
    width: 150,
    height: 150,
  },
  circleBottomLeft1: {
    bottom: -50,
    left: -50,
    width: 160,
    height: 160,
  },
  circleBottomRight1: {
    bottom: -70,
    right: -70,
    width: 200,
    height: 200,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginRight: 16,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    letterSpacing: 0.5,
    ...fontStyles.bold,
    textShadowColor: "rgba(255, 107, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollViewContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#FFE4CC",
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    ...fontStyles.semibold,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    padding: 16,
    borderRadius: 16,
    color: "#FFFFFF",
    fontSize: 16,
    ...fontStyles.medium,
  },
  inputError: {
    borderColor: "#FF6B00",
    borderWidth: 2,
  },
  errorText: {
    color: "#FF8C42",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    ...fontStyles.regular,
  },
  emptyListsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyListsText: {
    color: "#FFE4CC",
    fontSize: 14,
    opacity: 0.7,
    ...fontStyles.regular,
  },
  listsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 16,
  },
  listsLabel: {
    color: "#FFE4CC",
    fontSize: 13,
    marginBottom: 8,
    ...fontStyles.regular,
  },
  listsScroll: {
    maxHeight: 128,
    marginBottom: 8,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  listItemSelected: {
    backgroundColor: "rgba(255, 107, 0, 0.15)",
  },
  listItemText: {
    color: "#FFFFFF",
    fontSize: 15,
    ...fontStyles.medium,
  },
  listItemsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
  },
  noItemsText: {
    color: "#FFE4CC",
    fontSize: 13,
    opacity: 0.5,
    ...fontStyles.regular,
  },
  itemsScroll: {
    maxHeight: 128,
  },
  listItemCard: {
    backgroundColor: "rgba(255, 107, 0, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 0, 0.2)",
  },
  listItemName: {
    color: "#FFFFFF",
    fontSize: 15,
    ...fontStyles.semibold,
    marginBottom: 4,
  },
  listItemDetails: {
    color: "#FFE4CC",
    fontSize: 12,
    ...fontStyles.regular,
  },
  datePickerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    padding: 16,
    borderRadius: 16,
  },
  datePickerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  datePickerText: {
    color: "#FFFFFF",
    fontSize: 16,
    ...fontStyles.medium,
  },
  datePickerSubtext: {
    color: "#FFE4CC",
    fontSize: 12,
    marginTop: 4,
    ...fontStyles.regular,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  clearButton: {
    backgroundColor: "rgba(139, 69, 19, 0.8)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  clearButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    ...fontStyles.bold,
  },
  saveButton: {
    backgroundColor: "#FF6B00",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    ...fontStyles.heavy,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "rgba(61, 36, 23, 0.98)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255, 107, 0, 0.3)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    color: "#FFFFFF",
    ...fontStyles.bold,
    letterSpacing: 0.5,
  },
  modalDescription: {
    color: "#FFE4CC",
    fontSize: 14,
    marginBottom: 16,
    ...fontStyles.regular,
  },
  datePickerContainer: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  modalButton: {
    backgroundColor: "#FF6B00",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    ...fontStyles.heavy,
  },
  modalListScroll: {
    maxHeight: 256,
    marginBottom: 16,
  },
  modalListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalListItemSelected: {
    backgroundColor: "rgba(255, 107, 0, 0.2)",
    borderColor: "rgba(255, 107, 0, 0.4)",
  },
  modalListItemText: {
    color: "#FFFFFF",
    fontSize: 15,
    ...fontStyles.medium,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    backgroundColor: "rgba(139, 69, 19, 0.8)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
});