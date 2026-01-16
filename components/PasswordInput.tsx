import { useState } from 'react'
import { View, TextInput, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface PasswordInputProps {
  password: string
  setPassword: (text: string) => void
  placeholder?: string
  editable?: boolean // Added this
}

export default function PasswordInput ({
  password,
  setPassword,
  placeholder,
  editable = true // Added with default value
}: PasswordInputProps) {
  const [secure, setSecure] = useState(true)

  return (
    <View className='relative w-full mb-6'>
      <TextInput
        placeholder={placeholder ? placeholder : 'Password'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={secure}
        placeholderTextColor='#6B7280'
        editable={editable} // Added this
        className='border border-gray-300 p-3 rounded-xl bg-white/70 pr-12'
        style={{ opacity: editable ? 1 : 0.6 }} // Visual feedback
      />
      <TouchableOpacity
        onPress={() => setSecure(!secure)}
        disabled={!editable} // Disable when input is disabled
        className='absolute right-3 top-3'
        style={{ opacity: editable ? 1 : 0.5 }}
      >
        <Ionicons name={secure ? 'eye-off' : 'eye'} size={24} color='#6B7280' />
      </TouchableOpacity>
    </View>
  )
}