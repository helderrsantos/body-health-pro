import { QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const SUPABASE_PAUSED_MESSAGES = ['Project is paused', 'project is paused', 'ProjectPaused']

function isSupabasePausedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return SUPABASE_PAUSED_MESSAGES.some((msg) => error.message.includes(msg))
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isSupabasePausedError(error)) {
        toast.error('Sistema temporariamente indisponível. Aguarde alguns instantes e tente novamente.', {
          id: 'supabase-paused',
          duration: 10000,
        })
        return
      }
      toast.error('Erro ao carregar dados. Tente novamente.')
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isSupabasePausedError(error)) return false
        return failureCount < 2
      },
      staleTime: 1000 * 60,
    },
  },
})
