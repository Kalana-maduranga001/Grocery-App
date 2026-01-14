import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native'
import { useRouter } from 'expo-router'
import { useLoader } from '@/hooks/useLoader'
import { showToast } from '@/utils/notifications'
import GlassButton from '@/components/GlassButton'
import PasswordInput from '@/components/PasswordInput'
import { useAuth } from '@/hooks/useAuth'

export default function Login () {
  const router = useRouter()
  const { login } = useAuth()
  const { showLoader, hideLoader, isLoading } = useLoader()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      return showToast(
        'error',
        'Validation Error',
        'Please enter email and password'
      )
    }

    showLoader()
    try {
      await login(email, password)
      router.replace('/(dashboard)/home')
    } catch (err: any) {
      showToast('error', 'Login Error', err.message)
    } finally {
      hideLoader()
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className='flex-1 justify-center items-center bg-gray-50 p-6'>
        <View className='w-full bg-white/50 backdrop-blur-md rounded-2xl p-8 shadow-lg'>
          <Text className='text-3xl font-bold mb-6 text-center text-gray-900'>
            Login
          </Text>
          <TextInput
            placeholder='Email'
            value={email}
            onChangeText={setEmail}
            placeholderTextColor='#6B7280'
            className='border border-gray-300 p-3 mb-4 rounded-xl bg-white/70'
          />
          <PasswordInput password={password} setPassword={setPassword} />
          <GlassButton
            title='Login'
            onPress={handleLogin}
            loading={isLoading}
            bgColor='bg-blue-600/80'
          />
          <View className='flex-row justify-center mt-2'>
            <Text className='text-gray-700'>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/register')}
            >
              <Text className='text-blue-600 font-semibold'>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}
