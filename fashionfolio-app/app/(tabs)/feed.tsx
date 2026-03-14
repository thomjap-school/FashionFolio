import { useState, useEffect } from 'react'
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getFeed } from '../../services/api'

interface Post {
  id: number
  user_id: number
  outfit_data: string
  caption: string | null
  photo_url: string | null
  created_at: string
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchFeed = async () => {
    try {
      const res = await getFeed()
      setPosts(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchFeed() }, [])

  const renderOutfit = (outfit_data: string) => {
    try {
      const outfit = JSON.parse(outfit_data)
      const pieces = ['haut', 'bas', 'chaussures', 'accessoire']
      return (
        <View style={styles.outfitContainer}>
          {pieces.map(piece => outfit[piece] && (
            <View key={piece} style={styles.outfitPiece}>
              <Text style={styles.outfitLabel}>{piece.toUpperCase()}</Text>
              <Text style={styles.outfitName}>{outfit[piece].nom}</Text>
            </View>
          ))}
        </View>
      )
    } catch {
      return <Text style={styles.outfitName}>{outfit_data}</Text>
    }
  }

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={16} color="#fff" />
        </View>
        <Text style={styles.userId}>User #{item.user_id}</Text>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString('fr-FR')}
        </Text>
      </View>

      {item.photo_url && (
        <Image
          source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${item.photo_url}` }}
          style={styles.photo}
          resizeMode="cover"
        />
      )}

      {renderOutfit(item.outfit_data)}

      {item.caption && (
        <Text style={styles.caption}>{item.caption}</Text>
      )}
    </View>
  )

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator color="#fff" size="large" />
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPost}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchFeed() }}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="people-outline" size={48} color="#333" />
            <Text style={styles.empty}>Ajoute des amis pour voir leurs tenues !</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, gap: 16 },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  card: { backgroundColor: '#1a1a1a', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  userId: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 14 },
  date: { color: '#555', fontSize: 12 },
  photo: { width: '100%', height: 200 },
  outfitContainer: { padding: 12, gap: 8 },
  outfitPiece: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 8 },
  outfitLabel: { color: '#666', fontSize: 11, fontWeight: '600' },
  outfitName: { color: '#fff', fontSize: 14, marginTop: 2 },
  caption: { color: '#aaa', fontSize: 14, padding: 12, paddingTop: 0 },
  empty: { color: '#555', textAlign: 'center', fontSize: 15 },
})