import { useAuth } from "@/hooks/useAuth";
import { db } from "@/services/firebaseConfig";
import { showToast } from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Notification = {
  id: string;
  stockItemId: string;
  itemName: string;
  message: string;
  daysRemaining: number;
  isExpired?: boolean;
  seen: boolean;
  createdAt: any;
};

export default function Notifications() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
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
    if (!isLoading) {
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
  }, [isLoading]);

  // Fetch notifications from Firestore
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const notificationsRef = collection(db, "users", user.uid, "notifications");
    const unsub = onSnapshot(
      notificationsRef,
      (snapshot) => {
        const notifs: Notification[] = [];
        snapshot.forEach((d) => {
          notifs.push({ id: d.id, ...(d.data() as any) } as Notification);
        });
        // Sort by newest first
        notifs.sort(
          (a, b) =>
            (b.createdAt?.toDate?.()?.getTime() || 0) -
            (a.createdAt?.toDate?.()?.getTime() || 0),
        );
        setNotifications(notifs);
        setUnseenCount(notifs.filter((n) => !n.seen).length);
        setIsLoading(false);
      },
      (error) => {
        console.error("Notifications listener error:", error);
        setIsLoading(false);
      },
    );
    return () => unsub();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast("success", "Refreshed", "Notifications updated");
    }, 1000);
  }, []);

  // Mark notification as seen and delete from low stock
  const markAsSeen = useCallback(
    async (notificationId: string) => {
      if (!user) return;
      try {
        // Find the notification to get stockItemId
        const notification = notifications.find((n) => n.id === notificationId);

        if (notification && notification.stockItemId) {
          // Delete the stock item from the stock collection
          const stockRef = doc(
            db,
            "users",
            user.uid,
            "stock",
            notification.stockItemId,
          );
          await deleteDoc(stockRef);
        }

        // Delete the notification itself
        const notifRef = doc(
          db,
          "users",
          user.uid,
          "notifications",
          notificationId,
        );
        await deleteDoc(notifRef);

        showToast("success", "Removed", "Item removed from low stock");
      } catch (error) {
        console.error("Error marking notification as seen:", error);
        showToast("error", "Failed", "Could not remove item");
      }
    },
    [user, notifications],
  );

  // Delete a notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!user) return;
      try {
        const notifRef = doc(
          db,
          "users",
          user.uid,
          "notifications",
          notificationId,
        );
        await deleteDoc(notifRef);
        showToast("success", "Deleted", "Notification removed");
      } catch (error) {
        console.error("Error deleting notification:", error);
        showToast("error", "Failed", "Could not delete notification");
      }
    },
    [user],
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
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
              <Text style={styles.headerTitle}>🔔 Notifications</Text>
              <Text style={styles.headerSubtitle}>
                {notifications.length}{" "}
                {notifications.length === 1 ? "notification" : "notifications"}
              </Text>
            </View>
          </View>
          {unseenCount > 0 && (
            <View style={styles.unseenBadge}>
              <Text style={styles.unseenBadgeText}>{unseenCount}</Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{notifications.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{unseenCount}</Text>
            <Text style={styles.statLabel}>Unread</Text>
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
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="notifications-outline"
                size={64}
                color="#FFE4CC"
              />
              <Text style={styles.emptyStateText}>No notifications yet</Text>
              <Text style={styles.emptyStateSubtext}>
                You'll receive reminders here when your stock items are running
                low
              </Text>
            </View>
          ) : (
            <View style={styles.section}>
              {notifications.map((notif) => (
                <View
                  key={notif.id}
                  style={[
                    styles.notificationCard,
                    notif.isExpired
                      ? notif.seen
                        ? styles.expiredSeenCard
                        : styles.expiredUnseenCard
                      : notif.seen
                        ? styles.lowStockSeenCard
                        : styles.lowStockUnseenCard,
                  ]}
                >
                  {/* Unseen Badge */}
                  {!notif.seen && <View style={styles.unseenDot} />}

                  <View style={styles.notificationContent}>
                    <Text
                      style={[
                        styles.notificationTitle,
                        notif.isExpired && styles.expiredTitle,
                      ]}
                    >
                      {notif.itemName}
                    </Text>

                    <Text
                      style={[
                        styles.notificationMessage,
                        notif.isExpired
                          ? notif.seen
                            ? styles.expiredSeenMessage
                            : styles.expiredUnseenMessage
                          : notif.seen
                            ? styles.lowStockSeenMessage
                            : styles.lowStockUnseenMessage,
                      ]}
                    >
                      {notif.message}
                    </Text>

                    <View
                      style={[
                        styles.timeBadge,
                        notif.isExpired
                          ? styles.expiredTimeBadge
                          : styles.lowStockTimeBadge,
                      ]}
                    >
                      <Text style={styles.timeBadgeText}>
                        {notif.isExpired
                          ? "⏰ EXPIRED"
                          : `⏱️ ${notif.daysRemaining} day${notif.daysRemaining !== 1 ? "s" : ""} left`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionButtons}>
                    {!notif.seen && (
                      <TouchableOpacity
                        style={styles.markSeenButton}
                        onPress={() => markAsSeen(notif.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.markSeenButtonText}>Mark Seen</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.deleteButton,
                        notif.seen && styles.deleteButtonFull,
                      ]}
                      onPress={() => deleteNotification(notif.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#FF4444"
                      />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  unseenBadge: {
    backgroundColor: "#FF4444",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  unseenBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    ...fontStyles.heavy,
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
  notificationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  expiredUnseenCard: {
    backgroundColor: "rgba(255, 68, 68, 0.15)",
    borderColor: "rgba(255, 68, 68, 0.4)",
  },
  expiredSeenCard: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  lowStockUnseenCard: {
    backgroundColor: "rgba(255, 140, 66, 0.15)",
    borderColor: "rgba(255, 140, 66, 0.4)",
  },
  lowStockSeenCard: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  unseenDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF4444",
  },
  notificationContent: {
    marginBottom: 12,
    paddingRight: 20,
  },
  notificationTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    letterSpacing: 0.3,
    marginBottom: 8,
    ...fontStyles.bold,
  },
  expiredTitle: {
    color: "#FF6B6B",
  },
  notificationMessage: {
    fontSize: 14,
    letterSpacing: 0.2,
    marginBottom: 12,
    lineHeight: 20,
    ...fontStyles.regular,
  },
  expiredUnseenMessage: {
    color: "#FFB3B3",
    ...fontStyles.semibold,
  },
  expiredSeenMessage: {
    color: "#FFE4CC",
    opacity: 0.7,
  },
  lowStockUnseenMessage: {
    color: "#FFCC99",
    ...fontStyles.semibold,
  },
  lowStockSeenMessage: {
    color: "#FFE4CC",
    opacity: 0.7,
  },
  timeBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  expiredTimeBadge: {
    backgroundColor: "rgba(255, 68, 68, 0.25)",
  },
  lowStockTimeBadge: {
    backgroundColor: "rgba(255, 140, 66, 0.25)",
  },
  timeBadgeText: {
    color: "#FFE4CC",
    fontSize: 12,
    letterSpacing: 0.5,
    ...fontStyles.bold,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  markSeenButton: {
    backgroundColor: "rgba(76, 175, 80, 0.8)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.4)",
  },
  markSeenButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    ...fontStyles.bold,
  },
  deleteButton: {
    backgroundColor: "rgba(255, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.3)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  deleteButtonFull: {
    flex: 1,
  },
  deleteButtonText: {
    color: "#FF4444",
    fontSize: 13,
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
});
