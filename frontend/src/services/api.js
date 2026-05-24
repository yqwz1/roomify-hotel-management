import axios from 'axios'
import { API_BASE_URL } from '../config/runtime'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor (for adding auth tokens, etc.)
api.interceptors.request.use(
  (config) => {
    // You can add auth token here later
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

let logoutCallback = null;

export const setupInterceptors = (logoutFn) => {
  logoutCallback = logoutFn;
};

// Response interceptor (for handling errors globally)
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle errors globally
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access - Redirecting to login')
      if (logoutCallback) {
        logoutCallback();
      }
    }
    return Promise.reject(error)
  }
)

export default api
