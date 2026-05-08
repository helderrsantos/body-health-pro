import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RequireRole } from '@/components/auth/RequireRole'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { AccountDataPage } from '@/pages/AccountDataPage'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { ClientDetailPage } from '@/pages/ClientDetailPage'
import { EvaluationComparisonPage } from '@/pages/EvaluationComparisonPage'
import { ClientRegistrationPage } from '@/pages/ClientRegistrationPage'
import { LoginPage } from '@/pages/LoginPage'
import './App.css'

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
              <ClientRegistrationPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/account"
        element={
          <RequireAuth>
            <RequireRole role="admin">
              <AccountDataPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/cliente/:clienteId"
        element={
          <RequireAuth>
            <RequireRole role="admin">
              <ClientDetailPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/cliente/:clienteId/comparativo"
        element={
          <RequireAuth>
            <RequireRole role="admin">
              <EvaluationComparisonPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route path="/unauthorized" element={<p>Acesso nao autorizado para este perfil.</p>} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App
