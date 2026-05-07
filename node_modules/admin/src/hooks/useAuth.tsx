/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getSession,
  ensureProfileExists,
  signInWithGoogle,
  signInWithPassword,
  signOut,
  subscribeAuthChanges,
} from '@/services/auth/auth.service'
import type { UserProfile } from '@/types/auth'

interface AuthContextValue {
  isLoading: boolean
  isAuthenticated: boolean
  profile: UserProfile | null
  signIn: (email: string, password: string) => Promise<void>
  signInGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function resolveProfile() {
  const session = await getSession()

  if (!session?.user?.id) {
    return null
  }

  // Use ensureProfileExists to create profile if it doesn't exist
  // This acts as a fallback if the SQL trigger didn't run
  return ensureProfileExists(session.user.id)
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const loadProfile = useCallback(async () => {
    try {
      const loadedProfile = await resolveProfile()
      setProfile(loadedProfile)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()

    const unsubscribe = subscribeAuthChanges(async () => {
      setIsLoading(true)
      await loadProfile()
    })

    return unsubscribe
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithPassword(email, password)
    const loadedProfile = await resolveProfile()
    setProfile(loadedProfile)
  }, [])

  const signInGoogle = useCallback(async () => {
    await signInWithGoogle()
  }, [])

  const logout = useCallback(async () => {
    await signOut()
    setProfile(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: Boolean(profile),
      profile,
      signIn,
      signInGoogle,
      logout,
    }),
    [isLoading, profile, signIn, signInGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }

  return context
}
