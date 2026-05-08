import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateBR } from '@/utils/date'

interface AccessDataCardProps {
  email: string
  providers: string[]
  createdAt: string | null
  emailConfirmedAt: string | null
  lastSignInAt: string | null
}

const providerLabels: Record<string, string> = {
  email: 'E-mail e senha',
  google: 'Google',
}

function toProviderLabel(provider: string) {
  return providerLabels[provider] ?? provider.toUpperCase()
}

export function AccessDataCard({
  email,
  providers,
  createdAt,
  emailConfirmedAt,
  lastSignInAt,
}: Readonly<AccessDataCardProps>) {
  return (
    <Card>
      <CardHeader className="flex-col items-start gap-1 border-b border-[rgba(169,255,46,0.14)]">
        <CardTitle className="text-lg">Dados de Acesso</CardTitle>
        <CardDescription>
          Informacoes de autenticacao em modo somente leitura para manter seguranca da conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">E-mail de acesso</p>
          <p className="mt-1 text-sm font-semibold text-[#ecfff3]">{email}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Provedores ativos</p>
          <p className="mt-1 text-sm text-[#d8ffe8]">{providers.map(toProviderLabel).join(', ')}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Conta criada em</p>
            <p className="mt-1 text-sm text-[#d8ffe8]">{formatDateBR(createdAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Ultimo acesso</p>
            <p className="mt-1 text-sm text-[#d8ffe8]">{formatDateBR(lastSignInAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Confirmacao de e-mail</p>
            <p className="mt-1 text-sm text-[#d8ffe8]">{formatDateBR(emailConfirmedAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}