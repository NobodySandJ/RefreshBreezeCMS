import axios from 'axios'

// In production (Vercel), use relative path since FE & BE are deployed together
// In development, use localhost
const API_URL = import.meta.env.MODE === 'production'
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')

const api = axios.create({
  baseURL: API_URL,
})

// Add auth token to requests and handle Content-Type
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Only set Content-Type to JSON if data is not FormData
    // Let axios set the correct boundary for multipart/form-data
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }

    return config
  },
  (error) => Promise.reject(error)
)

export default api

