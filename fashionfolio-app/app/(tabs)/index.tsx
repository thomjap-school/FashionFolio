import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { getWardrobe } from '../../services/api'

interface ClothingItem {
  id: number
  name: string
  type: string
  color: string
  image_bg_removed_url: string | null
  is_favorite: boolean
}

export default function HomeScreen() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWardrobe().then(res => {
      setItems(res.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const favorites = items.filter(i => i.is_favorite)

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator color="#fff" size="large" />
    </View>
  )

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FashionFolio</Text>
        <Text style={styles.subtitle}>Bonjour 👋</Text>
      </View>

      {/* Stats rapides */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{items.length}</Text>
          <Text style={styles.statLabel}>vêtements</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{favorites.length}</Text>
          <Text style={styles.statLabel}>favoris</Text>
        </View>
      </View>

      {/* Actions rapides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/wardrobe')}
          >
            <Ionicons name="shirt-outline" size={28} color="#fff" />
            <Text style={styles.actionLabel}>Mon dressing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <Ionicons name="sparkles-outline" size={28} color="#fff" />
            <Text style={styles.actionLabel}>Style IA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/feed')}
          >
            <Ionicons name="people-outline" size={28} color="#fff" />
            <Text style={styles.actionLabel}>Feed</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Favoris */}
      {favorites.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes favoris ❤️</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {favorites.map(item => (
              <View key={item.id} style={styles.favoriteCard}>
                {item.image_bg_removed_url ? (
                  <Image
                    source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${item.image_bg_removed_url}` }}
                    style={styles.favoriteImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.favoritePlaceholder}>
                    <Ionicons name="shirt-outline" size={30} color="#333" />
                  </View>
                )}
                <Text style={styles.favoriteName} numberOfLines={1}>{item.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* CTA si dressing vide */}
      {items.length === 0 && (
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={() => router.push('/(tabs)/wardrobe')}
        >
          <Ionicons name="add-circle-outline" size={32} color="#fff" />
          <Text style={styles.ctaText}>Ajoute ton premier vêtement !</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  section: { margin: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 },
  actionLabel: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  favoriteCard: { width: 100, marginRight: 12, alignItems: 'center' },
  favoriteImage: { width: 100, height: 120, borderRadius: 12, backgroundColor: '#1a1a1a' },
  favoritePlaceholder: { width: 100, height: 120, borderRadius: 12, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  favoriteName: { color: '#aaa', fontSize: 12, marginTop: 6, textAlign: 'center' },
  ctaCard: { margin: 16, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, alignItems: 'center', gap: 12 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})