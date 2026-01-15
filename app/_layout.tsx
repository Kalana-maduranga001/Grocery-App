import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { Slot } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import '../globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { LoaderProvider } from '@/context/LoaderContext'

export default function RootLayout () {
  return (
    <LoaderProvider>
      <AuthProvider>
        <SafeAreaView className='flex-1 bg-gray-50'>
          <StatusBar style='dark' />
          <Slot />
        </SafeAreaView>
        <Toast />
      </AuthProvider>
    </LoaderProvider>
  )
}
  