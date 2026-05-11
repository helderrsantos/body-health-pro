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
  const {
    data: latestAvaliacao = null,
    isLoading: isLoadingLatest,
    error: latestError,
  } = useQuery({
    queryKey: ['avaliacoes-latest', clienteId],
    queryFn: () => (clienteId ? getLatestAvaliacaoByCliente(clienteId) : Promise.resolve(null)),
    enabled: enabled && !!clienteId,
  })
  const createMutation = useMutation({
    mutationFn: (data: AvaliacaoData) => createAvaliacao(data),
    onSuccess: () => {
      refetchAvaliacoes()
    },
  })
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; data: Omit<AvaliacaoData, 'clienteId'> }) =>
      updateAvaliacao(data.id, data.data),
    onSuccess: () => {
      refetchAvaliacoes()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (avaliacaoId: number) => deleteAvaliacao(avaliacaoId),
    onSuccess: () => {
      refetchAvaliacoes()
    },
  })
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
    avaliacoes,
    latestAvaliacao,
    evolutionStats,
    isLoading: isLoadingAvaliacoes || isLoadingLatest,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    error: avaliacoesError || latestError || createMutation.error || updateMutation.error || deleteMutation.error,
    createAvaliacao: createMutation.mutateAsync,
    updateAvaliacao: updateMutation.mutateAsync,
    deleteAvaliacao: deleteMutation.mutateAsync,
    refetch: refetchAvaliacoes,
  }
}
