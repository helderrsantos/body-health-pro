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
        <section className="card" style={{ maxWidth: 460 }}>
          <h1>Falha no login</h1>
          <small className="error">{error}</small>
        </section>
      </main>
    )
  }

  return <Navigate to="/admin" replace />
}
