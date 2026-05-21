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

    let cancelled = false
    let finished = false

    const finishFlow = async (userId?: string) => {
      if (finished || cancelled) return
      finished = true

      try {
        if (!userId) {
          throw new Error('Nao foi possivel concluir o login com Google. Tente novamente.')
        }

        await ensureProfileExists(userId)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao processar login.'
        setError(message)
        console.error('Callback error:', err)
      } finally {
        if (!cancelled) {
          setIsDone(true)
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION') return
      void finishFlow(session?.user?.id)
    })

    const pollSession = async () => {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (cancelled || finished) return

        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          await finishFlow()
          return
        }

        if (data.session?.user?.id) {
          await finishFlow(data.session.user.id)
          return
        }

        await new Promise((resolve) => {
          globalThis.setTimeout(resolve, 150)
        })
      }

      await finishFlow()
    }

    void pollSession()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
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
