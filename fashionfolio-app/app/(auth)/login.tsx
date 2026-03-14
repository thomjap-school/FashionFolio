import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native'
import { router } from 'expo-router'
import { login } from '../../services/api'
import { useAuthStore } from '../../store/auth'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setToken } = useAuthStore()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Remplis tous les champs')
      return
    }
    setLoading(true)
    try {
      const res = await login(email, password)
      setToken(res.data.access_token)
      router.replace('/(tabs)')
    } catch (e) {
      Alert.alert('Erreur', 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FashionFolio</Text>
      <Text style={styles.subtitle}>Connecte-toi</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.link}>Pas de compte ? S'inscrire</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', padding: 24 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#333'
  },
  button: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 16
  },
  buttonText: { color: '#0a0a0a', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#666', textAlign: 'center', fontSize: 14 },
})