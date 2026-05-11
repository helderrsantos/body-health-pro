import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { exchangeCodeForSession, getSession, ensureProfileExists } from '@/services/auth/auth.service'

export function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        await exchangeCodeForSession()
        const session = await getSession()
        if (session?.user?.id) {
          await ensureProfileExists(session.user.id)
        }
      } catch (callbackError) {
        const message = callbackError instanceof Error ? callbackError.message : 'Erro no callback OAuth.'
        setError(message)
        console.error('Callback error:', callbackError)
        console.error('Current URL:', globalThis.location.href)
      } finally {
        setIsDone(true)
      }
    })()
  }, [])

  if (!isDone) {
    return <p>Finalizando login com Google...</p>
  }

  if (error) {
    return (
      <main className="page">
        <section className="card" style={{ maxWidth: 560 }}>
          <h1>Falha no login</h1>
          <small className="error">{error}</small>
          <div style={{ marginTop: 20, fontSize: 12, color: '#999' }}>
            <p><strong>URL atual:</strong></p>
            <code style={{ wordBreak: 'break-all', display: 'block', padding: 10, background: '#f0f0f0' }}>
              {globalThis.location.href}
            </code>
            <p style={{ marginTop: 15 }}>
              <strong>Possíveis soluções:</strong>
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Verifique se o Redirect URL está configurado no Supabase: https://body-health-pro-admin.vercel.app/auth/callback</li>
              <li>Verifique se a chave de API do Google OAuth está correta no Supabase</li>
              <li>Tente limpar cookies e cache do navegador</li>
              <li>Verifique o console do navegador (F12) para mais detalhes</li>
            </ul>
          </div>
        </section>
      </main>
    )
  }

  return <Navigate to="/admin" replace />
}
