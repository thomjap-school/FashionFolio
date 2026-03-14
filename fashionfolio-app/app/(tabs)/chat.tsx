import { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { sendMessage } from '../../services/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  outfit?: any
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const flatListRef = useRef<FlatList>(null)

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await sendMessage(input, sessionId)
      setSessionId(res.data.session_id)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.message,
        outfit: res.data.outfit,
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (e) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Erreur lors de la génération de la tenue.',
      }])
    } finally {
      setLoading(false)
      flatListRef.current?.scrollToEnd()
    }
  }

  const renderOutfit = (outfit: any) => {
    const pieces = ['haut', 'bas', 'chaussures', 'accessoire']
    return (
      <View style={styles.outfitContainer}>
        {pieces.map(piece => outfit[piece] && (
          <View key={piece} style={styles.outfitPiece}>
            <Text style={styles.outfitLabel}>{piece.toUpperCase()}</Text>
            <Text style={styles.outfitName}>{outfit[piece].nom}</Text>
            {outfit[piece].marque && (
              <Text style={styles.outfitBrand}>{outfit[piece].marque}</Text>
            )}
          </View>
        ))}
      </View>
    )
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
      <Text style={styles.bubbleText}>{item.content}</Text>
      {item.outfit && renderOutfit(item.outfit)}
    </View>
  )

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Style IA</Text>
        <TouchableOpacity onPress={() => { setMessages([]); setSessionId(undefined) }}>
          <Ionicons name="refresh-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="sparkles-outline" size={48} color="#333" />
            <Text style={styles.empty}>Demande-moi comment t'habiller aujourd'hui !</Text>
          </View>
        }
      />

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#fff" size="small" />
          <Text style={styles.loadingText}>L'IA génère ta tenue...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ex: tenue casual pour aujourd'hui..."
          placeholderTextColor="#555"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          <Ionicons name="send" size={20} color="#0a0a0a" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  messageList: { padding: 16, paddingBottom: 20 },
  centered: { alignItems: 'center', marginTop: 80, gap: 16 },
  empty: { color: '#555', textAlign: 'center', fontSize: 15 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 12 },
  userBubble: { backgroundColor: '#fff', alignSelf: 'flex-end' },
  assistantBubble: { backgroundColor: '#1a1a1a', alignSelf: 'flex-start' },
  bubbleText: { fontSize: 15, color: '#0a0a0a' },
  outfitContainer: { marginTop: 10, gap: 8 },
  outfitPiece: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 8 },
  outfitLabel: { color: '#666', fontSize: 11, fontWeight: '600' },
  outfitName: { color: '#fff', fontSize: 14, marginTop: 2 },
  outfitBrand: { color: '#888', fontSize: 12, marginTop: 2 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  loadingText: { color: '#666', fontSize: 14 },
  inputRow: { flexDirection: 'row', padding: 16, gap: 10, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
  sendButton: { backgroundColor: '#fff', borderRadius: 24, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
})