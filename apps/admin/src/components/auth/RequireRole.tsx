import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { PageSkeleton } from '@/components/PageSkeleton'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/auth'

interface RequireRoleProps {
  role: UserRole
  children: ReactElement
}

export function RequireRole({ role, children }: Readonly<RequireRoleProps>) {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return <PageSkeleton />
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (profile.role !== role) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
