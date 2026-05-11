import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteClientById, listClients } from '@/services/clients/clients.service'
import type { ClientRow, ClientsListResult } from '@/types/client'

const PAGE_SIZE = 5
type SubmitEventLike = { preventDefault: () => void }

interface UseClientsListParams {
  refreshToken: number
}

export function useClientsList({ refreshToken }: Readonly<UseClientsListParams>) {
  const queryClient = useQueryClient()
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const clientsQueryKey = ['clients', page, query, refreshToken] as const

  const clientsQuery = useQuery<ClientsListResult, Error>({
    queryKey: clientsQueryKey,
    queryFn: ({ queryKey }) => {
      const [, currentPage, currentQuery] = queryKey

      return listClients({
        page: typeof currentPage === 'number' ? currentPage : 1,
        query: typeof currentQuery === 'string' ? currentQuery : '',
        pageSize: PAGE_SIZE,
      })
    },
  })

  const totalPages = Math.max(1, Math.ceil((clientsQuery.data?.count ?? 0) / PAGE_SIZE))

  const deleteMutation = useMutation<
    number,
    Error,
    number,
    { previous?: ClientsListResult }
  >({
    mutationFn: deleteClientById,
    onMutate: async (clientId) => {
      await queryClient.cancelQueries({ queryKey: clientsQueryKey })

      const previous = queryClient.getQueryData<ClientsListResult>(clientsQueryKey)

      if (previous) {
        queryClient.setQueryData<ClientsListResult>(clientsQueryKey, {
          rows: previous.rows.filter((item) => item.id !== clientId),
          count: Math.max(0, previous.count - 1),
        })
      }

      return { previous }
    },
    onError: (_error, _clientId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(clientsQueryKey, context.previous)
      }
    },
    onSettled: () => {
      setDeletingId(null)
      void queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  function handleSearch(event: SubmitEventLike) {
    event.preventDefault()
    setPage(1)
    setQuery(queryInput)
  }

  function handleClearSearch() {
    setQueryInput('')
    setQuery('')
    setPage(1)
  }

  function handlePreviousPage() {
    setPage((value) => Math.max(1, value - 1))
  }

  function handleNextPage() {
    setPage((value) => Math.min(totalPages, value + 1))
  }

  function handleDelete(client: ClientRow) {
    const confirmation = globalThis.confirm(
      `Deseja realmente deletar o cliente '${client.nome}'? Esta ação não pode ser desfeita.`,
    )

    if (!confirmation) {
      return
    }

    setDeletingId(client.id)

    deleteMutation.mutate(client.id, {
      onSuccess: () => {
        if ((clientsQuery.data?.rows.length ?? 0) === 1 && page > 1) {
          setPage((value) => Math.max(1, value - 1))
        }
      },
    })
  }

  return {
    queryInput,
    setQueryInput,
    page,
    totalPages,
    rows: clientsQuery.data?.rows ?? [],
    isLoading: clientsQuery.isLoading,
    queryError: clientsQuery.error?.message ?? null,
    deleteError: deleteMutation.error?.message ?? null,
    isDeleting: deleteMutation.isPending,
    deletingId,
    handleSearch,
    handleClearSearch,
    handlePreviousPage,
    handleNextPage,
    handleDelete,
  }
}
