import type { CustomerPrefix } from '../utils/profileValidation';

export type UserRole = 'admin' | 'customer'

export interface User {
  id: string
  prefix: CustomerPrefix | null
  name: string
  email: string
  phone: string | null
  role: UserRole
  createdAt: string
  profileCompleted: boolean
}
