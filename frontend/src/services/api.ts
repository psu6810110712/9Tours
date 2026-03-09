import axios, { type InternalAxiosRequestConfig } from 'axios'

let accessToken: string | null = null
export const setAccessToken = (token: string | null) => { accessToken = token }
export const getAccessToken = () => accessToken

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface AuthResponse {
  access_token: string
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const api = axios.create({
  baseURL,
  withCredentials: true,
})

let refreshPromise: Promise<string> | null = null

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<AuthResponse>(`${baseURL}/auth/refresh`, undefined, { withCredentials: true })
      .then((response) => {
        setAccessToken(response.data.access_token)
        return response.data.access_token
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config as RetryableRequestConfig | undefined
    if (error.response?.status !== 401 || !originalConfig) {
      return Promise.reject(error)
    }

    const url = originalConfig.url || ''
    const isAuthLifecycleRequest = (
      url.includes('/auth/login')
      || url.includes('/auth/register')
      || url.includes('/auth/refresh')
      || url.includes('/auth/logout')
    )

    if (isAuthLifecycleRequest || originalConfig._retry) {
      if (url.includes('/auth/refresh')) {
        setAccessToken(null)
        window.dispatchEvent(new CustomEvent('auth:expired'))
      }
      return Promise.reject(error)
    }

    try {
      originalConfig._retry = true
      const newAccessToken = await refreshAccessToken()
      originalConfig.headers.Authorization = `Bearer ${newAccessToken}`
      return api(originalConfig)
    } catch (refreshError) {
      setAccessToken(null)
      window.dispatchEvent(new CustomEvent('auth:expired'))
      return Promise.reject(refreshError)
    }
  }
)

export default api
