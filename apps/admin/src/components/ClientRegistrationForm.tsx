import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { InputField } from '@/components/ui/input'
import { SelectField } from '@/components/ui/select'
import { useClientRegistration } from '@/hooks/useClientRegistration'
import { clientRegistrationSchema } from '@/schemas/clientRegistrationSchema'
import type {
  ClientRegistrationFormProps,
  ClientRegistrationFormValues,
} from '@/types/client'

export function ClientRegistrationForm({ onClientCreated }: Readonly<ClientRegistrationFormProps>) {
  const { registerClient, isCreating, errorMessage } = useClientRegistration({ onClientCreated })

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<ClientRegistrationFormValues>({
    resolver: zodResolver(clientRegistrationSchema),
    mode: 'onBlur',
    defaultValues: {
      nome: '',
      dataNascimento: '',
      sexo: undefined,
    },
  })

  async function onSubmit(values: ClientRegistrationFormValues) {
    const isSuccess = await registerClient(values)
    if (!isSuccess) {
      return
    }

    reset()
    onClientCreated?.()
  }

  return (
    <section className="client-registration" aria-labelledby="cadastro-cliente-title">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <InputField
          control={control}
          name="nome"
          label="Nome completo"
          type="text"
          placeholder="Ex.: Maria da Silva"
        />

        <InputField
          control={control}
          name="dataNascimento"
          label="Data de nascimento"
          type="date"
        />

        <SelectField control={control} name="sexo" label="Sexo">
            <option value="">Selecione uma opção</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
        </SelectField>

        {errorMessage ? <small className="text-red-500 text-xs">{errorMessage}</small> : null}

        <div className="flex gap-3 mt-6">
          <Button
            type="submit"
            isLoading={isSubmitting || isCreating}
            loadingText="Salvando..."
            showLoadingText
            className="h-10 flex-1"
          >
            Cadastrar cliente
          </Button>
        </div>
      </form>
    </section>
  )
}
