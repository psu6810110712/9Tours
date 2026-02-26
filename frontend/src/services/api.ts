import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
})

// ขาไป: แนบ JWT token อัตโนมัติ (รองรับทั้ง localStorage และ sessionStorage)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ขากลับ: เพิ่มตัวดักจับ 401 Unauthorized (Token หมดอายุ / ไม่มีสิทธิ์)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // ล้างข้อมูลทั้งหมด
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')

      // บังคับเด้งกลับหน้าแรก (เฉพาะกรณีที่ไม่ได้อยู่หน้าแรก)
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default api