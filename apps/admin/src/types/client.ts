import type { z } from 'zod'
import type { clientRegistrationSchema } from '@/schemas/clientRegistrationSchema'

export type ClientRegistrationFormValues = z.input<typeof clientRegistrationSchema>

export interface ClientRegistrationFormProps {
  onClientCreated?: () => void
  embedded?: boolean
}

export interface ClientRow {
  id: number
  nome: string
  data_nascimento: string
  sexo: 'masculino' | 'feminino'
  created_at: string
}

export interface ClientsListProps {
  refreshToken: number
}

export interface ClientsListResult {
  rows: ClientRow[]
  count: number
}
