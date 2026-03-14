import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuthStore } from '../../store/auth'
import { api } from '../../services/api'

interface Stats {
  total: number
  by_type: Record<string, number>
  by_color: Record<string, number>
  most_common_type: string | null
  most_common_color: string | null
}

interface User {
  id: number
  email: string
  username: string
}

export default function ProfileScreen() {
  const { logout } = useAuthStore()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, statsRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/clothing/stats'),
        ])
        setUser(userRes.data)
        setStats(statsRes.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Tu veux vraiment te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter', style: 'destructive',
        onPress: () => {
          logout()
          router.replace('/(auth)/login')
        }
      }
    ])
  }

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator color="#fff" size="large" />
    </View>
  )

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.username}>@{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {stats && stats.total > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon Dressing</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>vêtements</Text>
            </View>
            {stats.most_common_type && (
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.most_common_type}</Text>
                <Text style={styles.statLabel}>type principal</Text>
              </View>
            )}
            {stats.most_common_color && (
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.most_common_color}</Text>
                <Text style={styles.statLabel}>couleur principale</Text>
              </View>
            )}
          </View>

          <Text style={styles.subTitle}>Par type</Text>
          {Object.entries(stats.by_type).map(([type, count]) => (
            <View key={type} style={styles.barRow}>
              <Text style={styles.barLabel}>{type}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(count / stats.total) * 100}%` }]} />
              </View>
              <Text style={styles.barCount}>{count}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ff4444" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  username: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: '#555' },
  section: { backgroundColor: '#1a1a1a', marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 12, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4, textAlign: 'center' },
  subTitle: { fontSize: 14, color: '#666', marginBottom: 12, fontWeight: '600' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  barLabel: { color: '#aaa', fontSize: 13, width: 80 },
  barTrack: { flex: 1, height: 6, backgroundColor: '#2a2a2a', borderRadius: 3 },
  barFill: { height: 6, backgroundColor: '#fff', borderRadius: 3 },
  barCount: { color: '#666', fontSize: 13, width: 20, textAlign: 'right' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 16, backgroundColor: '#1a1a1a', borderRadius: 16 },
  logoutText: { color: '#ff4444', fontWeight: '600', fontSize: 16 },
})