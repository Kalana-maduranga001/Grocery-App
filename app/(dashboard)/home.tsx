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
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
} from "react-native";

const { width, height } = Dimensions.get("window");

// Constants
const LOW_STOCK_THRESHOLD_DAYS = 2;
const MAX_LOW_STOCK_PREVIEW = 2;

// Types
interface GroceryList {
  id: string;
  name: string;
  itemCount: number;
  completedCount: number;
}

interface LowStockItem {
  id: string;
  name: string;
  quantity: string;
  daysLeft: number;
}

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [listsLoaded, setListsLoaded] = useState(false);
  const [stockLoaded, setStockLoaded] = useState(false);

  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  // Track which items we've already notified about to prevent spam
  const notifiedItems = useRef<Set<string>>(new Set());

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Memoized computed values
  const isDataReady = useMemo(
    () => listsLoaded && stockLoaded,
    [listsLoaded, stockLoaded]
  );

  // Animate content on load
  useEffect(() => {
    if (isDataReady) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDataReady]);

  // Real-time fetch lists and their item counts from Firestore
  useEffect(() => {
    if (!user) {
      console.log("[HOME] No user, skipping lists fetch");
      setListsLoaded(true);
      return;
    }

    console.log("[HOME] Starting lists listener for user:", user.uid);
    const listsRef = collection(db, "users", user.uid, "lists");

    // Track per-list item listeners so we can clean them up on list changes
    const itemUnsubs: Array<() => void> = [];

    const unsubLists = onSnapshot(
      listsRef,
      (snap) => {
        console.log("[HOME] Lists snapshot received, count:", snap.size);

        // Clear previous item listeners before re-subscribing
        itemUnsubs.forEach((fn) => fn());
        itemUnsubs.length = 0;

        if (snap.empty) {
          console.log("[HOME] No lists found");
          setGroceryLists([]);
          setListsLoaded(true);
          return;
        }

        // Initialize lists with zero counts
        const listsMap = new Map<string, GroceryList>();
        snap.docs.forEach((d) => {
          const data = d.data();
          listsMap.set(d.id, {
            id: d.id,
            name: data.name || "Untitled",
            itemCount: 0,
            completedCount: 0,
          });
        });

        // Set initial state
        setGroceryLists(Array.from(listsMap.values()));
        setListsLoaded(true);

        // Attach listeners to each list's items
        snap.docs.forEach((d) => {
          const itemsRef = collection(
            db,
            "users",
            user.uid,
            "lists",
            d.id,
            "items"
          );

          const unsubItems = onSnapshot(
            itemsRef,
            (itemsSnap) => {
              setGroceryLists((prev) =>
                prev.map((lst) =>
                  lst.id === d.id
                    ? { ...lst, itemCount: itemsSnap.size }
                    : lst
                )
              );
            },
            (error) => {
              console.warn(
                `[HOME] Items listener error for list ${d.id}:`,
                error.message
              );
            }
          );

          itemUnsubs.push(unsubItems);
        });
      },
      (error) => {
        console.warn("[HOME] Lists listener error:", error.message);
        setListsLoaded(true);
      }
    );

    return () => {
      unsubLists();
      itemUnsubs.forEach((fn) => fn());
    };
  }, [user]);

  // Real-time fetch stock from Firestore
  useEffect(() => {
    if (!user) {
      console.log("[HOME] No user, skipping stock fetch");
      setStockLoaded(true);
      return;
    }

    console.log("[HOME] Starting stock listener for user:", user.uid);
    const stockRef = collection(db, "users", user.uid, "stock");
    
    const unsub = onSnapshot(
      stockRef,
      (snap) => {
        const lowStockArr: LowStockItem[] = [];
        const now = Date.now();
        const currentNotifiedItems = new Set<string>();

        console.log(`[HOME] Stock snapshot received, total items: ${snap.size}`);

        snap.forEach((d) => {
          const data = d.data();
          if (!data.depletionDate) return;

          const dep = (data.depletionDate as Timestamp).toDate().getTime();
          const daysLeft = Math.ceil((dep - now) / (24 * 60 * 60 * 1000));

          console.log(`[HOME] Item: ${data.name}, Days left: ${daysLeft}`);

          // Create notifications for expired or running low items
          // Only notify if we haven't already notified for this item in this session
          const notificationKey = `${d.id}-${daysLeft <= 0 ? "expired" : "low"}`;
          
          if (!notifiedItems.current.has(notificationKey)) {
            if (daysLeft <= 0) {
              console.log(`[HOME] Creating EXPIRED notification for ${data.name}`);
              createStockNotification(
                user.uid,
                d.id,
                data.name || "Item",
                daysLeft,
                true
              );
              notifiedItems.current.add(notificationKey);
              currentNotifiedItems.add(notificationKey);
            } else if (daysLeft <= LOW_STOCK_THRESHOLD_DAYS) {
              console.log(`[HOME] Creating LOW STOCK notification for ${data.name}`);
              createStockNotification(
                user.uid,
                d.id,
                data.name || "Item",
                daysLeft,
                false
              );
              notifiedItems.current.add(notificationKey);
              currentNotifiedItems.add(notificationKey);
            }
          }

          // Only show items with threshold days or less remaining in home screen
          if (daysLeft <= LOW_STOCK_THRESHOLD_DAYS && daysLeft > 0) {
            lowStockArr.push({
              id: d.id,
              name: data.name || "Item",
              quantity: `${data.quantity || 0} ${data.unit || "units"}`,
              daysLeft,
            });
          }
        });

        // Clean up notification tracking for items that no longer exist
        notifiedItems.current = currentNotifiedItems;

        // Sort by days left (most urgent first)
        lowStockArr.sort((a, b) => a.daysLeft - b.daysLeft);

        console.log(`[HOME] Found ${lowStockArr.length} low stock items for display`);
        setLowStockItems(lowStockArr);
        setStockLoaded(true);
      },
      (error) => {
        console.warn("[HOME] Stock listener error:", error.message);
        setStockLoaded(true);
      }
    );

    return () => unsub();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // The listeners will automatically update when data changes
    // We just provide visual feedback
    setTimeout(() => {
      setRefreshing(false);
      showToast("success", "Refreshed", "Data is up to date");
    }, 1000);
  }, []);

  const handleLogout = useCallback(() => {
    showConfirmation(
      "Logout",
      "Are you sure you want to logout?",
      async () => {
        await logout();
        router.replace("/(auth)/login");
      }
    );
  }, [logout, router]);

  const handleLowStockPress = useCallback((item: LowStockItem) => {
    showToast("info", "Stock Alert", `${item.name} is running low`);
  }, []);

  const handleListPress = useCallback((listId: string) => {
    router.push({
      pathname: "/(dashboard)/list-details/[id]",
      params: { id: listId },
    });
  }, [router]);

  // Loading state
  if (!isDataReady) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Decorations */}
      <View style={styles.backgroundDecor}>
        <View style={[styles.circle, styles.circleTopLeft1]} />
        <View style={[styles.circle, styles.circleTopLeft2]} />
        <View style={[styles.circle, styles.circleTopRight1]} />
        <View style={[styles.circle, styles.circleBottomLeft1]} />
        <View style={[styles.circle, styles.circleBottomRight1]} />
        <View style={[styles.circle, styles.circleBottomRight2]} />
      </View>

      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>SmartGrocer 🛒</Text>
            <Text style={styles.headerSubtitle}>
              Welcome back, {user?.displayName || "User"}!
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#FFE4CC" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{groceryLists.length}</Text>
            <Text style={styles.statLabel}>Active Lists</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{lowStockItems.length}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B00"
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>⚠️ Low Stock Alert</Text>
                <TouchableOpacity
                  onPress={() => router.push("/(dashboard)/stock")}
                >
                  <Text style={styles.viewAllText}>
                    View All ({lowStockItems.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {lowStockItems.slice(0, MAX_LOW_STOCK_PREVIEW).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.lowStockCard}
                  onPress={() => handleLowStockPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.lowStockContent}>
                    <Text style={styles.lowStockName}>{item.name}</Text>
                    <Text style={styles.lowStockQuantity}>
                      Remaining: {item.quantity}
                    </Text>
                  </View>
                  <View style={styles.daysLeftBadge}>
                    <Text style={styles.daysLeftText}>{item.daysLeft}d left</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* My Grocery Lists */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 My Grocery Lists</Text>
              <TouchableOpacity onPress={() => router.push("/(dashboard)/lists")}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {groceryLists.length > 0 ? (
              groceryLists.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  style={styles.listCard}
                  onPress={() => handleListPress(list.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.listCardHeader}>
                    <Text style={styles.listCardTitle}>{list.name}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#B8865F" />
                  </View>

                  <View style={styles.listCardFooter}>
                    <Text style={styles.listItemCount}>
                      {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
                    </Text>
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="list-outline" size={48} color="#FFE4CC" />
                <Text style={styles.emptyStateText}>No grocery lists yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create your first list to get started
                </Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={[styles.section, { marginBottom: 100 }]}>
            <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>

            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={[styles.quickActionButton, styles.quickActionOrange]}
                onPress={() => router.push("/(dashboard)/create-list")}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={32} color="#FFFFFF" />
                <Text style={styles.quickActionText}>New List</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, styles.quickActionBrown]}
                onPress={() => router.push("/(dashboard)/add-stock")}
                activeOpacity={0.8}
              >
                <Ionicons name="cube-outline" size={32} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Add Stock</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={[styles.quickActionButton, styles.quickActionDark]}
                onPress={() => router.push("/(dashboard)/stock-goods")}
                activeOpacity={0.8}
              >
                <Ionicons name="cart-outline" size={32} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Stock Items</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, styles.quickActionLight]}
                onPress={() => router.push("/(dashboard)/notifications")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="notifications-outline"
                  size={32}
                  color="#FFFFFF"
                />
                <Text style={styles.quickActionText}>Reminders</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(dashboard)/create-list")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

// Common font style helper
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
  circleTopLeft2: {
    top: 40,
    left: 30,
    width: 100,
    height: 100,
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
  circleBottomRight2: {
    bottom: 100,
    right: 50,
    width: 80,
    height: 80,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    letterSpacing: 0.8,
    ...fontStyles.heavy,
    textShadowColor: "rgba(255, 107, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    color: "#FFE4CC",
    fontSize: 15,
    marginTop: 6,
    letterSpacing: 0.3,
    ...fontStyles.medium,
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  statCard: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 20,
    padding: 16,
    flex: 1,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 36,
    letterSpacing: -0.5,
    ...fontStyles.heavy,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    color: "#FFE4CC",
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    ...fontStyles.semibold,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    color: "#FFFFFF",
    letterSpacing: 0.5,
    ...fontStyles.bold,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  viewAllText: {
    color: "#FF8C42",
    fontSize: 14,
    letterSpacing: 0.3,
    ...fontStyles.semibold,
  },
  lowStockCard: {
    backgroundColor: "rgba(255, 140, 66, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 66, 0.3)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lowStockContent: {
    flex: 1,
  },
  lowStockName: {
    color: "#FFE4CC",
    fontSize: 16,
    letterSpacing: 0.3,
    ...fontStyles.bold,
  },
  lowStockQuantity: {
    color: "#FFE4CC",
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.2,
    ...fontStyles.regular,
  },
  daysLeftBadge: {
    backgroundColor: "#FF6B00",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  daysLeftText: {
    color: "#FFFFFF",
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    ...fontStyles.heavy,
  },
  listCard: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  listCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  listCardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    letterSpacing: 0.3,
    ...fontStyles.bold,
  },
  listCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  listItemCount: {
    color: "#FFE4CC",
    fontSize: 14,
    letterSpacing: 0.2,
    ...fontStyles.regular,
  },
  activeBadge: {
    backgroundColor: "rgba(76, 175, 80, 0.25)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.4)",
  },
  activeBadgeText: {
    color: "#4CAF50",
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    ...fontStyles.bold,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    color: "#FFE4CC",
    fontSize: 18,
    marginTop: 16,
    ...fontStyles.semibold,
  },
  emptyStateSubtext: {
    color: "#FFE4CC",
    fontSize: 14,
    marginTop: 8,
    opacity: 0.7,
    textAlign: "center",
    ...fontStyles.regular,
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  quickActionButton: {
    borderRadius: 20,
    padding: 16,
    flex: 1,
    marginHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  quickActionOrange: {
    backgroundColor: "rgba(255, 107, 0, 0.8)",
  },
  quickActionBrown: {
    backgroundColor: "rgba(139, 69, 19, 0.8)",
  },
  quickActionDark: {
    backgroundColor: "rgba(93, 63, 211, 0.8)",
  },
  quickActionLight: {
    backgroundColor: "rgba(251, 146, 60, 0.8)",
  },
  quickActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    marginTop: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    ...fontStyles.bold,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#FF6B00",
    borderRadius: 50,
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
});