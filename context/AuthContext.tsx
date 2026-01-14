import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/services/firebaseConfig'
import { loginUser, logoutUser } from '@/services/authService'
import { showToast } from '@/utils/notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppUser } from '@/types/user'
import { useLoader } from '@/hooks/useLoader'

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: async () => {},
  logout: async () => {}
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { showLoader, hideLoader, isLoading } = useLoader()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    showLoader()
    const unsubscribe = onAuthStateChanged(auth, usr => {
      setUser(usr)
      hideLoader()
    })
    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      showLoader()
      await loginUser(email, password)
      showToast('success', 'Login Successful')
    } catch (err: any) {
      showToast('error', 'Login Failed', err.message)
      throw err
    } finally {
      hideLoader()
    }
  }

  const logout = async () => {
    try {
      showLoader()
      await logoutUser()
      await AsyncStorage.clear()
      showToast('success', 'Logged out successfully')
    } catch (err: any) {
      showToast('error', 'Logout Failed', err.message)
      throw err
    } finally {
      hideLoader()
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading: isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
