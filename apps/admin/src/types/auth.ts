export type UserRole = 'admin' | 'cliente'

export interface UserProfile {
  id: string
  nome: string
  role: UserRole
  tenant_id: string
}
