import axios from 'axios'
import { useAuthStore } from '../store/auth'

// Récupération de l'URL depuis le .env
const API_URL = process.env.EXPO_PUBLIC_API_URL

export const api = axios.create({
  baseURL: API_URL,
})

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── AUTH ─────────────────────────────────────────────────
export const register = (email: string, username: string, password: string) =>
  api.post('/auth/register', { email, username, password })

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password })

// ─── CLOTHING ─────────────────────────────────────────────
export const getWardrobe = () => api.get('/clothing/')

export const uploadClothing = (formData: FormData) =>
  api.post('/clothing/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const deleteClothing = (id: number) => api.delete(`/clothing/${id}`)

export const toggleFavorite = (id: number) => api.patch(`/clothing/${id}/favorite`)

// ─── CHAT ─────────────────────────────────────────────────
export const sendMessage = (message: string, session_id?: string, city?: string) =>
  api.post('/chat/', { message, session_id, city })

// ─── SOCIAL ───────────────────────────────────────────────
export const getFeed = () => api.get('/social/feed')

export const getFriends = () => api.get('/social/friends')

export const searchUsers = (username: string) => 
  api.get(`/users/search?username=${username}`)

export const sendFriendRequest = (friend_id: number) =>
  api.post(`/social/friends/request/${friend_id}`)