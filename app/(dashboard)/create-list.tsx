import { useAuth } from "@/hooks/useAuth";
import { db } from "@/services/firebaseConfig";
import { showToast } from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

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
    <View className="flex-1 bg-gray-50">
      <View className="bg-green-600 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handleBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Create List</Text>
        </View>
      </View>

      <View className="mt-8 px-6">
        <Text className="text-gray-900 font-semibold mb-2">List Name</Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl p-4"
          placeholder="e.g. Weekly Groceries"
          value={name}
          onChangeText={setName}
        />

        <TouchableOpacity
          className="mt-6 bg-green-600 rounded-xl p-4 items-center"
          onPress={create}
          disabled={saving}
        >
          <Text className="text-white font-semibold">
            {saving ? "Creating..." : "Create"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
