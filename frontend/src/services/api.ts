import axios from 'axios'

// เก็บ access_token ไว้ใน memory เท่านั้น (ไม่เก็บ storage ใดๆ → ป้องกัน XSS)
let accessToken: string | null = null
export const setAccessToken = (token: string | null) => { accessToken = token }
export const getAccessToken = () => accessToken

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true, // ส่ง cookie ไปกับทุก request
})

// ขาไป: แนบ access_token จาก memory
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ขากลับ: เพิ่มตัวดักจับ 401 Unauthorized (Token หมดอายุ / ไม่มีสิทธิ์)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // ข้าม /auth/refresh เพราะ 401 จาก refresh แปลว่า "ยังไม่ได้ login" ไม่ใช่ "session หมดอายุ"
      const url = error.config?.url || ''
      const isRefreshRequest = url.includes('/auth/refresh')
      if (!isRefreshRequest) {
        window.dispatchEvent(new CustomEvent('auth:expired'))
      }
    }
    return Promise.reject(error)
  }
)

export default api