import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/services/clients/clients.service'
import type { ClientRegistrationFormValues } from '@/types/client'

interface UseClientRegistrationParams {
  onClientCreated?: () => void
}

export function useClientRegistration({ onClientCreated }: Readonly<UseClientRegistrationParams>) {
  const queryClient = useQueryClient()

  const createMutation = useMutation<void, Error, ClientRegistrationFormValues>({
    mutationFn: createClient,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] })
      onClientCreated?.()
    },
  })

  async function registerClient(values: ClientRegistrationFormValues) {
    try {
      await createMutation.mutateAsync(values)
      return true
    } catch {
      return false
    }
  }

  return {
    registerClient,
    isCreating: createMutation.isPending,
    errorMessage: createMutation.error?.message ?? null,
  }
}
