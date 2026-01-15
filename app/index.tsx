import { useAuth } from '@/hooks/useAuth'
import { Redirect } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'

export default function Index () {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View className='flex-1 justify-center items-center bg-gray-50'>
        <ActivityIndicator size='large' color='#4ade80' />
      </View>
    )
  }

  if (user) {
    return <Redirect href='./(dashboard)/home' />
  } else {
    return <Redirect href='./(auth)/login' />
  }
}
