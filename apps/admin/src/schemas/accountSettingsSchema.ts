import { z } from 'zod'

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/

export const profileSettingsSchema = z.object({
  nome: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length >= 3, 'Nome deve ter pelo menos 3 caracteres.'),
  email: z.email('Informe um e-mail valido.').transform((value) => value.trim().toLowerCase()),
})

export const passwordSettingsSchema = z
  .object({
    newPassword: z
      .string()
      .min(10, 'A senha deve ter pelo menos 10 caracteres.')
      .max(72, 'A senha deve ter no maximo 72 caracteres.')
      .refine(
        (value) => strongPasswordRegex.test(value),
        'Use letra maiuscula, minuscula, numero e caractere especial.',
      ),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'A confirmacao de senha nao confere.',
    path: ['confirmPassword'],
  })

export type ProfileSettingsValues = z.infer<typeof profileSettingsSchema>
export type PasswordSettingsValues = z.infer<typeof passwordSettingsSchema>