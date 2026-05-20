import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ensureProfileExists } from '@/services/auth/auth.service'

export function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(() => {
    const params = new URLSearchParams(globalThis.location.search)
    const errorParam = params.get('error')
    if (!errorParam) return null
    const description = params.get('error_description') ?? ''
    return `Erro OAuth: ${errorParam}. ${description}`
  })
  const [isDone, setIsDone] = useState<boolean>(
    () => new URLSearchParams(globalThis.location.search).get('error') !== null,
  )
  const isDatabaseSignupError = error?.includes('Database error saving new user') ?? false
  const currentCallbackUrl = `${globalThis.location.origin}${globalThis.location.pathname}`
  const expectedRedirectUrl = `${globalThis.location.origin}/auth/callback`

  useEffect(() => {
    if (new URLSearchParams(globalThis.location.search).get('error')) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION') return
      try {
        if (session?.user?.id) {
          await ensureProfileExists(session.user.id)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao processar login.'
        setError(message)
        console.error('Callback error:', err)
      } finally {
        setIsDone(true)
      }
    })

    return () => subscription.unsubscribe()
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
              {currentCallbackUrl}
            </code>
            <p style={{ marginTop: 15 }}>
              <strong>Possíveis soluções:</strong>
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Verifique se o Redirect URL está configurado no Supabase: {expectedRedirectUrl}</li>
              <li>Verifique se a chave de API do Google OAuth está correta no Supabase</li>
              <li>Tente limpar cookies e cache do navegador</li>
              <li>Verifique o console do navegador (F12) para mais detalhes</li>
            </ul>
            {isDatabaseSignupError && (
              <div style={{ marginTop: 16, padding: 12, border: '1px solid #f5c2c7', background: '#fff5f5', color: '#8a1f2b' }}>
                <strong>Diagnóstico:</strong> o Supabase falhou ao salvar o novo usuário em <code>auth.users</code>.
                <br />
                Aplique o hotfix em <code>packages/database/sql/hotfix_signup_500.sql</code> no projeto Supabase.
              </div>
            )}
          </div>
        </section>
      </main>
    )
  }

  return <Navigate to="/admin" replace />
}
