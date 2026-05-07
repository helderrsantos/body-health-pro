import type { z } from 'zod'
import type { composicaoCorporalSchema } from '@/schemas/composicaoCorporalSchema'

export type FormularioComposicaoCorporalValores = z.input<typeof composicaoCorporalSchema>
export type FormularioComposicaoCorporalDados = z.output<typeof composicaoCorporalSchema>

export interface ResultadoComposicaoCorporal {
  percentualGordura: string
  massaMagraKg: string
  massaGordaKg: string
}
