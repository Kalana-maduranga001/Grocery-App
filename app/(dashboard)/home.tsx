import React, { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { logoutUser } from '@/services/authService'

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const [counts, setCounts] = useState({ purchasedCount: 0, pendingCount: 0 })

  const handleLogout = async () => {
    await logoutUser()
    router.replace('/(auth)/login')
  }

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>Welcome, {user?.displayName || 'User'}!</Text>
        <Text>Your GroceryMate dashboard is ready.</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#22c55e', borderRadius: 12, padding: 16, marginRight: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => router.push('./tasks/form')}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 8, fontWeight: 'bold' }}>Add Item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#2563eb', borderRadius: 12, padding: 16, marginLeft: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => router.push('./tasks')}
        >
          <MaterialIcons name="list" size={24} color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 8, fontWeight: 'bold' }}>View Items</Text>
        </TouchableOpacity>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Quick Stats</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, backgroundColor: '#d1fae5', borderRadius: 12, padding: 16, marginRight: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#065f46' }}>{counts.purchasedCount}</Text>
            <Text style={{ color: '#047857' }}>Items Purchased</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fef3c7', borderRadius: 12, padding: 16, marginLeft: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#78350f' }}>{counts.pendingCount}</Text>
            <Text style={{ color: '#78350f' }}>Items Pending</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        style={{ marginTop: 24, backgroundColor: '#ef4444', padding: 16, borderRadius: 12, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  )
}
