export type UserRole = 'admin' | 'customer'

export interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: UserRole
  createdAt: string
}
