import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  createAvaliacao,
  getAvaliacoesByCliente,
  getLatestAvaliacaoByCliente,
  deleteAvaliacao,
  updateAvaliacao,
  type AvaliacaoData,
} from '@/services/avaliacoes/avaliacoes.service'

interface UseAvaliacoesOptions {
  clienteId?: number
  enabled?: boolean
}

/**
 * Hook to manage avaliacoes (assessments) for a client
 */
export function useAvaliacoes({ clienteId, enabled = true }: UseAvaliacoesOptions) {
  // Fetch all avaliacoes for this client
  const {
    data: avaliacoes = [],
    isLoading: isLoadingAvaliacoes,
    error: avaliacoesError,
    refetch: refetchAvaliacoes,
  } = useQuery({
    queryKey: ['avaliacoes', clienteId],
    queryFn: () => (clienteId ? getAvaliacoesByCliente(clienteId) : Promise.resolve([])),
    enabled: enabled && !!clienteId,
  })

  // Fetch latest avaliacao for this client
  const {
    data: latestAvaliacao = null,
    isLoading: isLoadingLatest,
    error: latestError,
  } = useQuery({
    queryKey: ['avaliacoes-latest', clienteId],
    queryFn: () => (clienteId ? getLatestAvaliacaoByCliente(clienteId) : Promise.resolve(null)),
    enabled: enabled && !!clienteId,
  })

  // Create avaliacao mutation
  const createMutation = useMutation({
    mutationFn: (data: AvaliacaoData) => createAvaliacao(data),
    onSuccess: () => {
      refetchAvaliacoes()
    },
  })

  // Update avaliacao mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; data: Omit<AvaliacaoData, 'clienteId'> }) =>
      updateAvaliacao(data.id, data.data),
    onSuccess: () => {
      refetchAvaliacoes()
    },
  })

  // Delete avaliacao mutation
  const deleteMutation = useMutation({
    mutationFn: (avaliacaoId: number) => deleteAvaliacao(avaliacaoId),
    onSuccess: () => {
      refetchAvaliacoes()
    },
  })

  // Calculate evolution stats
  const evolutionStats = useMemo(() => {
    if (avaliacoes.length < 2) return null

    const first = avaliacoes[avaliacoes.length - 1] // oldest
    const latest = avaliacoes[0] // newest

    const firstDate = first.dataAvaliacao ? new Date(first.dataAvaliacao) : null
    const latestDate = latest.dataAvaliacao ? new Date(latest.dataAvaliacao) : null

    return {
      gorduraChange: latest.percentualGordura - first.percentualGordura,
      magraChange: latest.massaMagraKg - first.massaMagraKg,
      gorduraChangePercent:
        ((latest.percentualGordura - first.percentualGordura) / first.percentualGordura) * 100,
      diasDecorridos:
        firstDate && latestDate
          ? Math.floor((latestDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      totalAvaliacoes: avaliacoes.length,
    }
  }, [avaliacoes])

  return {
    // Data
    avaliacoes,
    latestAvaliacao,
    evolutionStats,

    // Loading states
    isLoading: isLoadingAvaliacoes || isLoadingLatest,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Errors
    error: avaliacoesError || latestError || createMutation.error || updateMutation.error || deleteMutation.error,

    // Mutations
    createAvaliacao: createMutation.mutateAsync,
    updateAvaliacao: updateMutation.mutateAsync,
    deleteAvaliacao: deleteMutation.mutateAsync,

    // Refetch
    refetch: refetchAvaliacoes,
  }
}
