import { createContext } from 'react'
import type { UserProfile } from '@/types/auth'

export interface AuthContextValue {
  isLoading: boolean
  isAuthenticated: boolean
  profile: UserProfile | null
  signIn: (email: string, password: string) => Promise<void>
  signInGoogle: () => Promise<void>
  logout: () => Promise<void>
  reloadProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
