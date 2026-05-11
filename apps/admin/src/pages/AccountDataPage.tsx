import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AccessDataCard } from '@/components/account/AccessDataCard'
import type { AccountSectionId } from '@/components/account/account-sections'
import { AccountSectionMenu } from '@/components/account/AccountSectionMenu'
import { PasswordSettingsForm } from '@/components/account/PasswordSettingsForm'
import { ProfileSettingsForm } from '@/components/account/ProfileSettingsForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import type { ProfileSettingsValues } from '@/schemas/accountSettingsSchema'
import {
  getCurrentAccessData,
  updatePassword,
  updateProfileData,
} from '@/services/auth/account.service'

export function AccountDataPage() {
  const navigate = useNavigate()
  const { profile, reloadProfile } = useAuth()

  const [activeSection, setActiveSection] = useState<AccountSectionId>('access')
  const [globalError, setGlobalError] = useState<string | null>(null)

  const accessQuery = useQuery({
    queryKey: ['account', 'access-data'],
    queryFn: getCurrentAccessData,
  })

  const profileMutation = useMutation({
    mutationFn: updateProfileData,
    onSuccess: async () => {
      await reloadProfile()
    },
  })

  const passwordMutation = useMutation({
    mutationFn: updatePassword,
  })

  async function handleProfileSave(values: ProfileSettingsValues) {
    setGlobalError(null)

    try {
      const result = await profileMutation.mutateAsync(values)
      await accessQuery.refetch()
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar perfil.'
      setGlobalError(message)
      throw error
    }
  }

  async function handlePasswordSave(newPassword: string) {
    setGlobalError(null)

    try {
      await passwordMutation.mutateAsync(newPassword)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar senha.'
      setGlobalError(message)
      throw error
    }
  }

  const accessData = accessQuery.data
  const email = accessData?.email ?? ''

  function renderAccessSection() {
    if (accessQuery.isLoading) {
      return (
        <Card>
          <CardContent className="py-6 text-sm text-gray-400">Carregando dados de acesso...</CardContent>
        </Card>
      )
    }
    if (accessData) {
      return (
        <AccessDataCard
          email={accessData.email ?? '-'}
          providers={accessData.providers}
          createdAt={accessData.createdAt}
          emailConfirmedAt={accessData.emailConfirmedAt}
          lastSignInAt={accessData.lastSignInAt}
        />
      )
    }
    return (
      <Card>
        <CardContent className="py-6 text-sm text-red-400">
          Não foi possível carregar os dados de acesso.
        </CardContent>
      </Card>
    )
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-[1024px]">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="m-0 text-2xl font-bebas tracking-widest text-[#eafff1] sm:text-3xl">
              Dados da Conta
            </h1>
            <p className="mt-2 max-w-prose text-sm text-gray-400">
              Central de gerenciamento de acesso, perfil e credenciais de seguranca.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => navigate('/admin')} className="h-10">
            Voltar para home
          </Button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
          <AccountSectionMenu activeSection={activeSection} onSelect={setActiveSection} />

          <section aria-live="polite" className="space-y-4">
            {globalError ? <small className="block text-xs text-red-400">{globalError}</small> : null}

            {activeSection === 'access' ? renderAccessSection() : null}

            {activeSection === 'profile' ? (
              <Card>
                <CardHeader className="flex-col items-start gap-1 border-b border-[rgba(169,255,46,0.14)]">
                  <CardTitle className="text-lg">Editar Perfil</CardTitle>
                  <CardDescription>
                    Atualize seus dados de identificacao e mantenha as informacoes da conta em dia.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <ProfileSettingsForm
                    initialValues={{
                      nome: profile?.nome ?? '',
                      email,
                    }}
                    isSubmitting={profileMutation.isPending}
                    onSubmit={handleProfileSave}
                  />
                </CardContent>
              </Card>
            ) : null}

            {activeSection === 'password' ? (
              <Card>
                <CardHeader className="flex-col items-start gap-1 border-b border-[rgba(169,255,46,0.14)]">
                  <CardTitle className="text-lg">Alterar Senha</CardTitle>
                  <CardDescription>
                    Defina uma nova senha forte para reduzir risco de acesso indevido.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <PasswordSettingsForm
                    isSubmitting={passwordMutation.isPending}
                    onSubmit={handlePasswordSave}
                  />
                </CardContent>
              </Card>
            ) : null}

            {activeSection === 'billing' ? (
              <Card>
                <CardHeader className="flex-col items-start gap-1 border-b border-[rgba(169,255,46,0.14)]">
                  <CardTitle className="text-lg">Pagamento</CardTitle>
                  <CardDescription>
                    Esta secao ja esta preparada para acoplar Stripe sem alterar o restante da conta.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5 text-sm text-gray-300">
                  Proxima etapa: adicionar integracao de assinatura e metodo de pagamento com Stripe.
                </CardContent>
              </Card>
            ) : null}

          </section>
        </div>
      </section>
    </main>
  )
}