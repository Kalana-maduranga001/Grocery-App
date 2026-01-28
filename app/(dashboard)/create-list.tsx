import { useAuth } from "@/hooks/useAuth";
import { db } from "@/services/firebaseConfig";
import { showToast } from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View, StyleSheet, Platform } from "react-native";

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

export default function CreateList() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleBack = () => {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(dashboard)/home");
    }
  };

  const create = async () => {
    if (!user) {
      showToast("error", "Not logged in");
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("info", "Enter a list name");
      return;
    }
    try {
      setSaving(true);
      const listsRef = collection(db, "users", user.uid, "lists");
      const docRef = await addDoc(listsRef, {
        name: trimmed,
        createdAt: serverTimestamp(),
      });
      showToast("success", "List created");
      router.push({
        pathname: "/(dashboard)/list-details/[id]",
        params: { id: docRef.id },
      });
    } catch (e: any) {
      showToast("error", "Failed to create", e.message);
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
          <Text style={styles.headerTitle}>Create List</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="list" size={48} color="#FF6B00" />
          </View>

          <Text style={styles.label}>List Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Weekly Groceries"
            placeholderTextColor="rgba(255, 228, 204, 0.4)"
            value={name}
            onChangeText={setName}
            editable={!saving}
          />

          <TouchableOpacity
            style={[styles.createButton, saving && styles.createButtonDisabled]}
            onPress={create}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>
              {saving ? "Creating..." : "Create List"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            💡 Tip: Give your list a descriptive name to easily find it later
          </Text>
        </View>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "rgba(255, 107, 0, 0.15)",
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 107, 0, 0.3)",
  },
  label: {
    color: "#FFE4CC",
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    ...fontStyles.semibold,
    marginBottom: 12,
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#FF6B00",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    ...fontStyles.heavy,
  },
  hint: {
    color: "#FFE4CC",
    fontSize: 13,
    marginTop: 16,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 20,
    ...fontStyles.regular,
  },
});