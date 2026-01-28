import { useAuth } from "@/hooks/useAuth";
import { db } from "@/services/firebaseConfig";
import { showToast } from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState, useRef, useCallback } from "react";
import { 
  Alert, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  View,
  Platform,
  StyleSheet,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

export default function Lists() {
  const router = useRouter();
  const { user } = useAuth();
  const [lists, setLists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const handleBack = () => {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(dashboard)/home");
    }
  };

  // Animate content on load
  useEffect(() => {
    if (!isLoading && lists.length >= 0) {
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
  }, [isLoading, lists.length]);

  // Real-time lists with per-list item counts
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

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
          setIsLoading(false);
          return;
        }

        // Seed lists without counts
        const base = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
          itemCount: 0,
        }));
        setLists(base);
        setIsLoading(false);

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
        setIsLoading(false);
      },
    );

    return () => {
      unsubLists();
      itemUnsubs.forEach((fn) => fn());
    };
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // The listeners will automatically update when data changes
    setTimeout(() => {
      setRefreshing(false);
      showToast("success", "Refreshed", "Data is up to date");
    }, 1000);
  }, []);

  // Delete a list
  const deleteList = useCallback((listId: string, listName: string) => {
    if (!user) return;
    Alert.alert("Delete List", `Are you sure you want to delete "${listName}"?`, [
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
  }, [user]);

  const handleListPress = useCallback((listId: string) => {
    router.push({
      pathname: "/(dashboard)/list-details/[id]",
      params: { id: listId },
    });
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading your lists...</Text>
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
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFE4CC" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>📋 My Lists</Text>
              <Text style={styles.headerSubtitle}>
                {lists.length} {lists.length === 1 ? 'list' : 'lists'} total
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{lists.length}</Text>
            <Text style={styles.statLabel}>Total Lists</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {lists.reduce((sum, list) => sum + (list.itemCount || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Total Items</Text>
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
          {lists.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={64} color="#FFE4CC" />
              <Text style={styles.emptyStateText}>No grocery lists yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Create your first list to get started
              </Text>
            </View>
          ) : (
            <View style={styles.section}>
              {lists.map((list) => (
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
                      {list.itemCount || 0} {list.itemCount === 1 ? 'item' : 'items'}
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteList(list.id, list.name);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF4444" />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
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

// Common font style helper - EXACT COPY FROM HOME
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
    marginBottom: 16,
  },
  headerLeft: {
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
  deleteButton: {
    backgroundColor: "rgba(255, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.3)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deleteButtonText: {
    color: "#FF4444",
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    ...fontStyles.bold,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
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