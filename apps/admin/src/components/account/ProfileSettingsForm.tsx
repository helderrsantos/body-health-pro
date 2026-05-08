import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { InputField } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  profileSettingsSchema,
  type ProfileSettingsValues,
} from '@/schemas/accountSettingsSchema'

interface ProfileSettingsFormProps {
  initialValues: ProfileSettingsValues
  isSubmitting: boolean
  onSubmit: (values: ProfileSettingsValues) => Promise<{ emailUpdateRequiresConfirmation: boolean }>
}

export function ProfileSettingsForm({
  initialValues,
  isSubmitting,
  onSubmit,
}: Readonly<ProfileSettingsFormProps>) {
  const [feedback, setFeedback] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    mode: 'onBlur',
    defaultValues: initialValues,
  })

  useEffect(() => {
    reset(initialValues)
  }, [initialValues, reset])

  async function handleValidSubmit(values: ProfileSettingsValues) {
    setFeedback(null)

    const result = await onSubmit(values)
    setFeedback(
      result.emailUpdateRequiresConfirmation
        ? 'Perfil salvo. Confira seu novo e-mail para concluir a alteracao de endereco.'
        : 'Perfil atualizado com sucesso.',
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(handleValidSubmit)} noValidate>
      <InputField control={control} name="nome" label="Nome" placeholder="Seu nome de exibicao" />
      <InputField
        control={control}
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@empresa.com"
      />

      {feedback ? <small className="block text-xs text-[#a9ff2e]">{feedback}</small> : null}

      <Button
        type="submit"
        isLoading={isSubmitting}
        loadingText="Salvando perfil..."
        className="h-10"
        disabled={!isDirty && !isSubmitting}
      >
        Salvar perfil
      </Button>
    </form>
  )
}