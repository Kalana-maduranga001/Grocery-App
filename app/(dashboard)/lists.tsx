import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { db } from "@/services/firebaseConfig"
import { collection, doc, onSnapshot, updateDoc, deleteDoc, increment } from "firebase/firestore"
import { useAuth } from "@/hooks/useAuth"
import { showToast } from "@/utils/notifications"

export default function Lists() {
  const router = useRouter()
  const { user } = useAuth()
  const [lists, setLists] = useState<any[]>([])

  useEffect(() => {
    if (!user) return

    const listsRef = collection(db, "users", user.uid, "lists")

    const unsubscribe = onSnapshot(
      listsRef,
      snapshot => {
        const userLists: any[] = []
        snapshot.forEach(doc => {
          userLists.push({ id: doc.id, ...doc.data() })
        })
        setLists(userLists)
      },
      error => {
        console.error("Failed to fetch lists in real-time:", error)
        showToast("error", "Error", "Could not fetch lists")
      }
    )

    return () => unsubscribe()
  }, [user])

  const markItemCompleted = async (listId: string) => {
    try {
    //   const listRef = doc(db, "users", user.uid, "lists", listId)
    //   await updateDoc(listRef, { completedCount: increment(1) })
      showToast("success", "Updated", "Item marked completed")
    } catch (error) {
      console.error(error)
      showToast("error", "Failed", "Could not update list")
    }
  }

  const deleteList = async (listId: string) => {
    Alert.alert("Delete List", "Are you sure you want to delete this list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // await deleteDoc(doc(db, "users", user.uid, "lists", listId))
            showToast("success", "Deleted", "List deleted successfully")
          } catch (error) {
            console.error(error)
            showToast("error", "Failed", "Could not delete list")
          }
        },
      },
    ])
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-green-600 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">📋 My Grocery Lists</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 mt-4" showsVerticalScrollIndicator={false}>
        {lists.length === 0 ? (
          <View className="items-center mt-20">
            <Ionicons name="list-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-lg">No grocery lists yet</Text>
          </View>
        ) : (
          lists.map(list => {
            const progress =
              list.itemCount === 0 ? 0 : Math.round((list.completedCount / list.itemCount) * 100)

            return (
              <TouchableOpacity
                key={list.id}
                className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
                onPress={() => router.push(`/(dashboard)/list-details?id=${list.id}`)}
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-900 font-semibold text-lg flex-1">{list.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600 text-sm">
                    {list.completedCount}/{list.itemCount} completed
                  </Text>
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      className="bg-green-100 rounded-full px-3 py-1"
                      onPress={() => markItemCompleted(list.id)}
                    >
                      <Text className="text-green-700 font-semibold text-xs">{progress}% ✅</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-red-100 rounded-full px-3 py-1"
                      onPress={() => deleteList(list.id)}
                    >
                      <Text className="text-red-700 font-semibold text-xs">Delete 🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="mt-3 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <View className="bg-green-500 h-full" style={{ width: `${progress}%` }} />
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-green-600 rounded-full w-16 h-16 items-center justify-center shadow-lg"
        onPress={() => router.push("/(dashboard)/create-list")}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  )
}
