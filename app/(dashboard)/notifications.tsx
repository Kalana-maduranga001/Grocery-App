import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Notifications() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-green-600 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Notifications</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 mt-4">
        <View className="items-center mt-20">
          <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
          <Text className="text-gray-500 mt-4 text-lg">
            No notifications yet
          </Text>
          <Text className="text-gray-400 mt-2 text-center">
            You'll receive reminders here when your stock items are running low.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
