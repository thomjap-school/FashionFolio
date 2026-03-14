import { useEffect, useState } from 'react'
import { Stack, router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '../store/auth'

export default function RootLayout() {
  const { token, setToken } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem('token').then((savedToken) => {
      if (savedToken) setToken(savedToken)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!loading) {
      if (token) {
        router.replace('/(tabs)')
      } else {
        router.replace('/(auth)/login')
      }
    }
  }, [token, loading])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}