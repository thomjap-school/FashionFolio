import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthState {
  token: string | null
  user: { id: number; email: string; username: string } | null
  setToken: (token: string) => void
  setUser: (user: AuthState['user']) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setToken: (token) => {
    AsyncStorage.setItem('token', token)
    set({ token })
  },
  setUser: (user) => set({ user }),
  logout: () => {
    AsyncStorage.removeItem('token')
    set({ token: null, user: null })
  },
}))