import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { PageSkeleton } from '@/components/PageSkeleton'
import { useAuth } from '@/hooks/useAuth'

export function RequireAuth({ children }: Readonly<{ children: ReactElement }>) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <PageSkeleton />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
