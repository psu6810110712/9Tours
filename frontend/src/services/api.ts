import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
})

// แนบ JWT token ทุก request อัตโนมัติ
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
