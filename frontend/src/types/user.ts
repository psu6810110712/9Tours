export type UserRole = 'admin' | 'customer'

export interface User {
  id: number
  name: string
  email: string
  phone: string
  role: UserRole
  createdAt: string
}
