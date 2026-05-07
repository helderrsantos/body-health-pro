import { z } from 'zod'

const TODAY = new Date().toISOString().slice(0, 10)

export const clientRegistrationSchema = z.object({
  nome: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length >= 3, 'Nome deve ter pelo menos 3 caracteres.'),
  dataNascimento: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => z.iso.date().safeParse(value).success, 'Data de nascimento invalida.')
    .refine((value) => value <= TODAY, 'Data de nascimento nao pode ser futura.'),
  sexo: z.string().min(1, 'Selecione o sexo biologico.').pipe(z.enum(['masculino', 'feminino'])),
})
