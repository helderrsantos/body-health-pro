import { CreditCard, KeyRound, ShieldUser, UserRound } from 'lucide-react'

export type AccountSectionId = 'access' | 'profile' | 'password' | 'billing'

export interface AccountSectionDefinition {
  id: AccountSectionId
  title: string
  description: string
  enabled: boolean
  icon: typeof ShieldUser
}

export const ACCOUNT_SECTIONS: AccountSectionDefinition[] = [
  {
    id: 'access',
    title: 'Acesso',
    description: 'Informacoes da conta e provedores de login.',
    enabled: true,
    icon: ShieldUser,
  },
  {
    id: 'profile',
    title: 'Perfil',
    description: 'Edite nome, e-mail e dados de identificacao.',
    enabled: true,
    icon: UserRound,
  },
  {
    id: 'password',
    title: 'Senha',
    description: 'Atualize sua senha com regras fortes de seguranca.',
    enabled: true,
    icon: KeyRound,
  },
  {
    id: 'billing',
    title: 'Pagamento',
    description: 'Espaco reservado para integracao com Stripe.',
    enabled: false,
    icon: CreditCard,
  },
]