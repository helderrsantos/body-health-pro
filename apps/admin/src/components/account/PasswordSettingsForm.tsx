import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { InputField } from '@/components/ui/input'
import {
  passwordSettingsSchema,
  type PasswordSettingsValues,
} from '@/schemas/accountSettingsSchema'

interface PasswordSettingsFormProps {
  isSubmitting: boolean
  onSubmit: (newPassword: string) => Promise<void>
}

export function PasswordSettingsForm({
  isSubmitting,
  onSubmit,
}: Readonly<PasswordSettingsFormProps>) {
  const [feedback, setFeedback] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<PasswordSettingsValues>({
    resolver: zodResolver(passwordSettingsSchema),
    mode: 'onBlur',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  async function handleValidSubmit(values: PasswordSettingsValues) {
    setFeedback(null)
    await onSubmit(values.newPassword)
    reset()
    setFeedback('Senha atualizada com sucesso.')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(handleValidSubmit)} noValidate>
      <InputField
        control={control}
        name="newPassword"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        placeholder="Digite uma senha forte"
      />
      <InputField
        control={control}
        name="confirmPassword"
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        placeholder="Repita a nova senha"
      />

      <small className="block text-xs text-gray-400">
        Minimo de 10 caracteres com maiuscula, minuscula, numero e simbolo.
      </small>
      {feedback ? <small className="block text-xs text-[#a9ff2e]">{feedback}</small> : null}

      <Button
        type="submit"
        isLoading={isSubmitting}
        loadingText="Atualizando senha..."
        className="h-10"
        disabled={!isDirty && !isSubmitting}
      >
        Alterar senha
      </Button>
    </form>
  )
}