import { useState, type FormEvent as ReactFormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { signUpAdmin } from '@/services/auth/auth.service'

type AuthMode = 'login' | 'signup'

export function LoginPage() {
  const { signIn, signInGoogle, isAuthenticated, isLoading } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('')
  const [nomeAdmin, setNomeAdmin] = useState('')
  const [nomeTenant, setNomeTenant] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  async function handleGoogleSignIn() {
    setError(null)

    try {
      await signInGoogle()
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Erro no login com Google.'
      setError(message)
    }
  }

  if (isLoading) {
    return <p>Carregando...</p>
  }

  async function handleLoginSubmit(event: ReactFormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      await signIn(email, password)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Erro no login.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSignupSubmit(event: ReactFormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      if (signupPassword !== signupPasswordConfirm) {
        throw new Error('As senhas não conferem.')
      }

      await signUpAdmin(signupEmail, signupPassword, nomeAdmin, nomeTenant)
      
      setSuccessMessage(
        'Cadastro realizado com sucesso! Verifique seu email e faça login.'
      )
      
      setSignupEmail('')
      setSignupPassword('')
      setSignupPasswordConfirm('')
      setNomeAdmin('')
      setNomeTenant('')
      
      setTimeout(() => {
        setMode('login')
        setSuccessMessage(null)
      }, 2000)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Erro no cadastro.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 grid place-items-center">
      <section className="card w-full max-w-[460px]">
        <header className="mb-4">
          <h1 className="m-0 text-3xl font-bebas font-semibold text-[#eafff1] tracking-widest uppercase">
            Body Health Pro
          </h1>
          <p className="mt-2 text-gray-400 max-w-prose text-sm">
            {mode === 'login'
              ? 'Entre com sua conta para acessar o painel.'
              : 'Crie uma conta de administrador para começar.'}
          </p>
        </header>

        {mode === 'login' ? (
          <>
            <form className="grid grid-cols-2 gap-4 mt-6" onSubmit={handleLoginSubmit}>
              <label className="field col-span-2 flex flex-col gap-2">
                <span className="font-semibold text-[#a9ff2e]">Email</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="email@exemplo.com"
                  required
                  className="border border-[rgb(169_255_46_/_0.5)]"
                />
              </label>

              <label className="field col-span-2 flex flex-col gap-2">
                <span className="font-semibold text-[#a9ff2e]">Senha</span>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  required
                  className="border border-[rgb(169_255_46_/_0.5)]"
                />
              </label>

              {error ? (
                <small className="col-span-2 text-red-500 text-xs">
                  {error}
                </small>
              ) : null}

              <div className="col-span-2 flex flex-col gap-4 sm:gap-4 mt-2">
                <Button type="submit" isLoading={isSubmitting} loadingText="Entrando..." showLoadingText className="w-full h-12">
                  Entrar
                </Button>
                <Button type="button" variant="outline" onClick={() => void handleGoogleSignIn()} className="w-full h-12">
                  Continuar com Google
                </Button>
              </div>
            </form>

            <p className="flex flex-wrap gap-1 sm:gap-2 items-center justify-center text-center mt-6 text-xs sm:text-xs text-gray-500">
              <span>Não tem conta?</span>
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setError(null)
                }}
                className="bg-transparent border-0 text-[#a9ff2e] cursor-pointer underline text-xs font-semibold px-0 py-0 hover:opacity-80 transition-opacity duration-200"
              >
                Crie uma conta
              </button>
            </p>
          </>
        ) : (
          <>
            <form className="grid grid-cols-2 gap-4 mt-6" onSubmit={handleSignupSubmit}>
              <label className="field col-span-2 flex flex-col gap-2">
                <span className="font-semibold text-[#a9ff2e]">Nome do Admin</span>
                <Input
                  type="text"
                  value={nomeAdmin}
                  onChange={(event) => setNomeAdmin(event.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="border border-[rgb(169_255_46_/_0.5)]"
                />
              </label>

              <label className="field col-span-2 flex flex-col gap-2">
                <span className="font-semibold text-[#a9ff2e]">Nome da Empresa/Tenant</span>
                <Input
                  type="text"
                  value={nomeTenant}
                  onChange={(event) => setNomeTenant(event.target.value)}
                  placeholder="Ex: Body Health Studio"
                  required
                  className="border border-[rgb(169_255_46_/_0.5)]"
                />
              </label>

              <label className="field col-span-2 flex flex-col gap-2">
                <span className="font-semibold text-[#a9ff2e]">Email</span>
                <Input
                  type="email"
                  value={signupEmail}
                  onChange={(event) => setSignupEmail(event.target.value)}
                  placeholder="email@exemplo.com"
                  required
                  className="border border-[rgb(169_255_46_/_0.5)]"
                />
              </label>

              <label className="field col-span-2 flex flex-col gap-2">
                <span className="font-semibold text-[#a9ff2e]">Senha</span>
                <Input
                  type="password"
                  value={signupPassword}
                  onChange={(event) => setSignupPassword(event.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="border border-[rgb(169_255_46_/_0.5)]"
                />
              </label>

              <label className="field col-span-2 flex flex-col gap-2">
                <span className="font-semibold text-[#a9ff2e]">Confirmar Senha</span>
                <Input
                  type="password"
                  value={signupPasswordConfirm}
                  onChange={(event) => setSignupPasswordConfirm(event.target.value)}
                  placeholder="Confirme a senha"
                  required
                  className="border border-[rgb(169_255_46_/_0.5)]"
                />
              </label>

              {error ? (
                <small className="col-span-2 text-red-500 text-xs">
                  {error}
                </small>
              ) : null}

              {successMessage ? (
                <small className="col-span-2 text-[#a9ff2e]">
                  {successMessage}
                </small>
              ) : null}

              <div className="col-span-2 flex flex-col gap-3 mt-2">
                <Button type="submit" isLoading={isSubmitting} loadingText="Criando..." showLoadingText className="w-full h-12">
                  Criar Conta
                </Button>
              </div>
            </form>

            <p className="flex flex-wrap gap-1 sm:gap-2 items-center justify-center text-center mt-4 text-xs sm:text-xs text-gray-500">
              <span>Já tem conta?</span>
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError(null)
                }}
                className="bg-transparent border-0 text-[#a9ff2e] cursor-pointer underline text-xs font-semibold px-0 py-0 hover:opacity-80 transition-opacity duration-200"
              >
                Entre aqui
              </button>
            </p>
          </>
        )}
      </section>
    </main>
  )
}
