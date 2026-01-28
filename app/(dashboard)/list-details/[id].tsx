// app/(dashboard)/list-details/[id].tsx
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/services/firebaseConfig";
import { showToast } from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View, StyleSheet, Platform, ActivityIndicator } from "react-native";

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
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading user...</Text>
      </View>
    );
  }

  // Wait for listId
  if (!listId) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF6B00" />
        <Text style={styles.errorText}>No list selected</Text>
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
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{listName}</Text>
            <Text style={styles.headerSubtitle}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="cube-outline" size={64} color="#FF6B00" />
            </View>
            <Text style={styles.emptyStateText}>No items yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add items to your list to get started
            </Text>
          </View>
        ) : (
          items.map((item) => {
            return (
              <View
                key={item.id}
                style={styles.itemCard}
              >
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => deleteItem(item.id)}
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF6B00" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.itemDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="cube-outline" size={16} color="#FFE4CC" />
                    <Text style={styles.detailText}>
                      {item.quantity} {item.unit || "units"}
                    </Text>
                  </View>
                  
                  {item.expectedDurationDays ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color="#FFE4CC" />
                      <Text style={styles.detailText}>
                        {item.expectedDurationDays} days
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3D2417",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFE4CC",
    fontSize: 16,
    marginTop: 16,
    ...fontStyles.medium,
  },
  errorText: {
    color: "#FFE4CC",
    fontSize: 18,
    marginTop: 16,
    ...fontStyles.semibold,
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
  headerTextContainer: {
    flex: 1,
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
  headerSubtitle: {
    color: "#FFE4CC",
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.3,
    ...fontStyles.regular,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollViewContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    backgroundColor: "rgba(255, 107, 0, 0.15)",
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(255, 107, 0, 0.3)",
  },
  emptyStateText: {
    color: "#FFE4CC",
    fontSize: 20,
    marginBottom: 8,
    ...fontStyles.semibold,
  },
  emptyStateSubtext: {
    color: "#FFE4CC",
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    ...fontStyles.regular,
  },
  itemCard: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemName: {
    color: "#FFFFFF",
    fontSize: 18,
    letterSpacing: 0.3,
    ...fontStyles.bold,
    flex: 1,
    marginRight: 12,
  },
  deleteButton: {
    backgroundColor: "rgba(255, 107, 0, 0.15)",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 0, 0.3)",
  },
  itemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    color: "#FFE4CC",
    fontSize: 14,
    letterSpacing: 0.2,
    ...fontStyles.regular,
  },
});