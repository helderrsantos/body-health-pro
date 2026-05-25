import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RequireRole } from '@/components/auth/RequireRole'
import { PageSkeleton } from '@/components/PageSkeleton'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { LoginPage } from '@/pages/LoginPage'
import './App.css'

const AccountDataPage = lazy(() =>
  import('@/pages/AccountDataPage').then((module) => ({ default: module.AccountDataPage })),
)
const ClientDetailPage = lazy(() =>
  import('@/pages/ClientDetailPage').then((module) => ({ default: module.ClientDetailPage })),
)
const ClientRegistrationPage = lazy(() =>
  import('@/pages/ClientRegistrationPage').then((module) => ({ default: module.ClientRegistrationPage })),
)
const EvaluationComparisonPage = lazy(() =>
  import('@/pages/EvaluationComparisonPage').then((module) => ({ default: module.EvaluationComparisonPage })),
)

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireRole role="admin">
              <AdminDashboardPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/clients/new"
        element={
          <RequireAuth>
            <RequireRole role="admin">
              <Suspense fallback={<PageSkeleton />}>
                <ClientRegistrationPage />
              </Suspense>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/account"
        element={
          <RequireAuth>
            <RequireRole role="admin">
              <Suspense fallback={<PageSkeleton />}>
                <AccountDataPage />
              </Suspense>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/cliente/:clienteId"
        element={
          <RequireAuth>
            <RequireRole role="admin">
              <Suspense fallback={<PageSkeleton />}>
                <ClientDetailPage />
              </Suspense>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/cliente/:clienteId/comparativo"
        element={
          <RequireAuth>
            <RequireRole role="admin">
              <Suspense fallback={<PageSkeleton />}>
                <EvaluationComparisonPage />
              </Suspense>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route path="/unauthorized" element={<p>Acesso não autorizado para este perfil.</p>} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App
