import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useAuth } from '@/hooks/useAuth'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter, useSegments } from 'expo-router'

// Mock service to fetch stock counts
const getStockCounts = async () => {
  // Replace with API call or local DB query
  return {
    itemsInStock: 12,
    itemsLow: 3
  }
}

export default function Home() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const segment = useSegments()
  const [counts, setCounts] = useState({ itemsInStock: 0, itemsLow: 0 })

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const data = await getStockCounts()
        setCounts(data)
      } catch (error) {
        console.error('Failed to fetch stock counts', error)
      }
    }

    fetchCounts()
  }, [segment])

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout()
            router.replace('/(auth)/login') // Navigate to login
          }
        }
      ]
    )
  }

  return (
    <View className="flex-1 bg-gray-50 p-6">
      {/* Welcome Card */}
      <View className="bg-white rounded-3xl p-6 shadow-md mb-6">
        <Text className="text-3xl font-bold text-gray-800 mb-2">
          Welcome, {user?.displayName || 'User'}!
        </Text>
        <Text className="text-gray-600 text-base">
          Manage your groceries and stock efficiently.
        </Text>
      </View>

      {/* Buttons */}
      <View className="flex-row justify-between mb-6">
        <TouchableOpacity
          className="flex-1 mr-3 bg-green-600 rounded-2xl p-4 flex-row items-center justify-center shadow"
          onPress={() => router.push('./(dashboard)/items/form')}
        >
          <MaterialIcons name="add" size={24} color="white" />
          <Text className="text-white font-semibold ml-2">Add Item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 ml-3 bg-blue-600 rounded-2xl p-4 flex-row items-center justify-center shadow"
          onPress={() => router.push('./(dashboard)/items')}
        >
          <MaterialIcons name="list" size={24} color="white" />
          <Text className="text-white font-semibold ml-2">View Items</Text>
        </TouchableOpacity>
      </View>

      {/* Stock Stats */}
      <View className="bg-white rounded-2xl p-6 shadow mb-6">
        <Text className="text-gray-800 text-lg font-semibold mb-3">
          Stock Overview
        </Text>
        <View className="flex-row justify-between">
          <View className="bg-green-100 p-4 rounded-2xl flex-1 mr-2 items-center">
            <Text className="text-green-800 font-bold text-xl">
              {counts.itemsInStock}
            </Text>
            <Text className="text-green-700 text-sm">Items in Stock</Text>
          </View>
          <View className="bg-yellow-100 p-4 rounded-2xl flex-1 ml-2 items-center">
            <Text className="text-yellow-800 font-bold text-xl">
              {counts.itemsLow}
            </Text>
            <Text className="text-yellow-700 text-sm">Items Low</Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        className="bg-red-600 rounded-2xl p-4 flex-row items-center justify-center shadow"
        onPress={handleLogout}
      >
        <MaterialIcons name="logout" size={24} color="white" />
        <Text className="text-white font-semibold ml-2">Logout</Text>
      </TouchableOpacity>
    </View>
  )
}
