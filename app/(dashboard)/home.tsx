import { useEffect, useState } from 'react'
// import { View, Text, TouchableOpacity } from 'react-native'
import { useAuth } from '@/hooks/useAuth'
// import { MaterialIcons } from '@expo/vector-icons'
import { useRouter, useSegments } from 'expo-router'
// import { getTaskCounts } from '@/services/taskService'

export default function Home () {
  const { user } = useAuth()
  const router = useRouter()
  const [counts, setCounts] = useState({ completedCount: 0, pendingCount: 0 })
  const segment = useSegments()

  useEffect(() => {
    const fetchCounts = async () => {
    //   const data = await getTaskCounts()
    //   setCounts(data)
    }

    fetchCounts()
  }, [segment])

//    return (
    // <View className='flex-1 bg-gray-50 p-6'>
    //   <View className='bg-white rounded-3xl p-6 shadow-md mb-6'>
    //     <Text className='text-3xl font-bold text-gray-800 mb-2'>
    //       Welcome, {user?.displayName || 'User'}!
    //     </Text>
    //     <Text className='text-gray-600 text-base'>
    //       Your dashboard is ready. Manage your tasks easily.
    //     </Text>
    //   </View>

    //   <View className='flex-row justify-between mb-6'>
    //     <TouchableOpacity
    //       className='flex-1 mr-3 bg-green-600 rounded-2xl p-4 flex-row items-center justify-center shadow'
    //       onPress={() => router.push('./(dashboard)/tasks/form')}
    //     >
    //       <MaterialIcons name='add' size={24} color='white' />
    //       <Text className='text-white font-semibold ml-2'>Add Task</Text>
    //     </TouchableOpacity>

    //     <TouchableOpacity
    //       className='flex-1 ml-3 bg-blue-600 rounded-2xl p-4 flex-row items-center justify-center shadow'
    //       onPress={() => router.push('./(dashboard)/tasks')}
    //     >
    //       <MaterialIcons name='list' size={24} color='white' />
    //       <Text className='text-white font-semibold ml-2'>View Tasks</Text>
    //     </TouchableOpacity>
    //   </View>

    //   <View className='bg-white rounded-2xl p-6 shadow'>
    //     <Text className='text-gray-800 text-lg font-semibold mb-3'>
    //       Quick Stats
    //     </Text>
    //     <View className='flex-row justify-between'>
    //       <View className='bg-green-100 p-4 rounded-2xl flex-1 mr-2 items-center'>
    //         <Text className='text-green-800 font-bold text-xl'>
    //           {counts.completedCount}
    //         </Text>
    //         <Text className='text-green-700 text-sm'>Tasks Completed</Text>
    //       </View>
    //       <View className='bg-yellow-100 p-4 rounded-2xl flex-1 ml-2 items-center'>
    //         <Text className='text-yellow-800 font-bold text-xl'>
    //           {counts.pendingCount}
    //         </Text>
    //         <Text className='text-yellow-700 text-sm'>Tasks Pending</Text>
    //       </View>
    //     </View>
    //   </View>
    // </View>
//   )
}