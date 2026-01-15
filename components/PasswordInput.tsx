import { useState } from 'react'
import { View, TextInput, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons' // or any icon library

export default function PasswordInput ({
  password,
  setPassword,
  placeholder
}: {
  password: string
  setPassword: (text: string) => void
  placeholder?: string
}) {
  const [secure, setSecure] = useState(true)

  return (
    <View className='relative w-full mb-6'>
      <TextInput
        placeholder={placeholder ? placeholder : 'Password'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={secure}
        placeholderTextColor='#6B7280'
        className='border border-gray-300 p-3 rounded-xl bg-white/70 pr-12'
      />
      <TouchableOpacity
        onPress={() => setSecure(!secure)}
        className='absolute right-3 top-3'
      >
        <Ionicons name={secure ? 'eye-off' : 'eye'} size={24} color='#6B7280' />
      </TouchableOpacity>
    </View>
  )
}
