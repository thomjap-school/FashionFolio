import { useState, useEffect } from 'react'
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, RefreshControl
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { getWardrobe, uploadClothing, deleteClothing, toggleFavorite } from '../../services/api'

interface ClothingItem {
  id: number
  name: string
  type: string
  color: string
  style: string | null
  image_bg_removed_url: string | null
  is_favorite: boolean
}

export default function WardrobeScreen() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchWardrobe = async () => {
    try {
      const res = await getWardrobe()
      setItems(res.data)
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger le dressing')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchWardrobe() }, [])

  const handleUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    })
    if (result.canceled) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'clothing.jpg',
      } as any)
      await uploadClothing(formData)
      fetchWardrobe()
    } catch (e) {
      Alert.alert('Erreur', 'Upload échoué')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (id: number) => {
    Alert.alert('Supprimer', 'Tu veux vraiment supprimer ce vêtement ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await deleteClothing(id)
          setItems(items.filter(i => i.id !== id))
        }
      }
    ])
  }

  const handleFavorite = async (id: number) => {
    await toggleFavorite(id)
    setItems(items.map(i => i.id === id ? { ...i, is_favorite: !i.is_favorite } : i))
  }

    const renderItem = ({ item }: { item: ClothingItem }) => (
    <View style={styles.card}>
        {item.image_bg_removed_url ? (
        <Image
            source={{ 
            uri: `${process.env.EXPO_PUBLIC_API_URL as string}${item.image_bg_removed_url}` 
            }}
            style={styles.image}
            resizeMode="contain"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="shirt-outline" size={40} color="#333" />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>{item.type} • {item.color}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleFavorite(item.id)}>
          <Ionicons
            name={item.is_favorite ? 'heart' : 'heart-outline'}
            size={22}
            color={item.is_favorite ? '#ff4444' : '#555'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginTop: 8 }}>
          <Ionicons name="trash-outline" size={22} color="#555" />
        </TouchableOpacity>
      </View>
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
        <Text style={styles.title}>Mon Dressing</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleUpload} disabled={uploading}>
          {uploading
            ? <ActivityIndicator color="#0a0a0a" size="small" />
            : <Ionicons name="add" size={24} color="#0a0a0a" />
          }
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWardrobe() }} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.empty}>Ton dressing est vide{'\n'}Ajoute ton premier vêtement !</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  addButton: { backgroundColor: '#fff', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  card: { flexDirection: 'row', backgroundColor: '#1a1a1a', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 12, alignItems: 'center' },
  image: { width: 70, height: 70, borderRadius: 10 },
  imagePlaceholder: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 12 },
  name: { color: '#fff', fontWeight: '600', fontSize: 15 },
  detail: { color: '#666', fontSize: 13, marginTop: 4 },
  actions: { alignItems: 'center', paddingLeft: 8 },
  empty: { color: '#555', textAlign: 'center', fontSize: 16, lineHeight: 24 },
})