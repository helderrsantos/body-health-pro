import { useNavigate } from 'react-router-dom'
import { EditClientModal } from '@/components/EditClientModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useClientsList } from '@/hooks/useClientsList'
import { useAvaliacoes } from '@/hooks/useAvaliacoes'
import type { ClientsListProps } from '@/types/client'
import { formatDateBR } from '@/utils/date'

function ClientCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl p-4 mb-2.5 bg-[rgba(9,16,12,0.86)] border border-[rgba(169,255,46,0.2)]">
      {/* nome + subtext */}
      <div>
        <Skeleton className="h-[18px] sm:h-[20px] w-2/5" />
        <Skeleton className="h-3 sm:h-3.5 w-3/5 mt-1" />
      </div>

      {/* stat boxes — replica do p-2 com label xs + valor lg/base */}
      <div className="flex gap-4 text-sm">
        <div className="flex-1 rounded-lg p-2 bg-[rgba(169,255,46,0.05)]">
          <Skeleton className="h-3 w-4/5 mb-1.5" />
          <Skeleton className="h-[22px] w-1/4" />
        </div>
        <div className="flex-1 rounded-lg p-2 bg-[rgba(169,255,46,0.05)]">
          <Skeleton className="h-3 w-4/5 mb-1.5" />
          <Skeleton className="h-[18px] w-2/5" />
        </div>
      </div>

      {/* botões Editar + Deletar */}
      <div className="flex justify-end gap-2 mt-1">
        <Skeleton className="h-10 w-[58px] rounded-xl" />
        <Skeleton className="h-10 w-[72px] rounded-xl" />
      </div>
    </div>
  )
}
interface ClientItemProps {
  clientId: number
  nome: string
  sexo: string
  dataNascimento: string
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

function ClientCardItem({
  clientId,
  nome,
  sexo,
  dataNascimento,
  onEdit,
  onDelete,
  isDeleting,
}: Readonly<ClientItemProps>) {
  const navigate = useNavigate()
  const { avaliacoes, latestAvaliacao } = useAvaliacoes({ clienteId: clientId })

  return (
    <button
      type="button"
      className="clients-item flex flex-col gap-3 rounded-2xl p-4 mb-2.5 bg-[rgba(9,16,12,0.86)] border border-[rgba(169,255,46,0.2)] cursor-pointer hover:border-[rgba(169,255,46,0.4)] hover:bg-[rgba(9,16,12,0.95)] transition-all text-left w-full"
      onClick={() => navigate(`/admin/cliente/${clientId}`)}
    >
      <div>
        <strong className="text-[#eafff1] text-sm sm:text-base">{nome}</strong>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">
          {sexo} · {formatDateBR(dataNascimento)}
        </p>
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex-1 bg-[rgba(169,255,46,0.1)] rounded-lg p-2">
          <p className="text-gray-400 text-xs">Total de Avaliações</p>
          <p className="text-[#a9ff2e] font-semibold text-lg">{avaliacoes.length}</p>
        </div>
        {latestAvaliacao ? (
          <div className="flex-1 bg-[rgba(78,14,14,0.3)] rounded-lg p-2">
            <p className="text-gray-400 text-xs">Última Avaliação</p>
            <p className="text-[#ff7b7b] font-semibold">
              {latestAvaliacao.dataAvaliacao
                ? formatDateBR(latestAvaliacao.dataAvaliacao)
                : 'N/A'}
            </p>
          </div>
        ) : (
          <div className="flex-1 bg-[rgba(150,150,150,0.1)] rounded-lg p-2">
            <p className="text-gray-400 text-xs">Nenhuma Avaliação</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-1 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-10 flex-1 sm:flex-none"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          disabled={isDeleting}
        >
          Editar
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="h-10 flex-1 sm:flex-none"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          disabled={isDeleting}
        >
          Deletar
        </Button>
      </div>
    </button>
  )
}

export function ClientsList({ refreshToken }: Readonly<ClientsListProps>) {
  const {
    queryInput,
    setQueryInput,
    page,
    totalPages,
    rows,
    isLoading,
    queryError,
    deleteError,
    isDeleting,
    deletingId,
    editingClient,
    isSavingEdit,
    handleEditOpen,
    handleEditClose,
    handleEditSave,
    handleSearch,
    handleClearSearch,
    handlePreviousPage,
    handleNextPage,
    handleDelete,
  } = useClientsList({ refreshToken })

  return (
    <section className="mt-5 border-t border-[rgba(169,255,46,0.26)] pt-4" aria-labelledby="lista-clientes-title">
      <h2 id="lista-clientes-title" className="m-0 mb-3 font-bebas font-medium tracking-tight text-[#d8ffe8]">
        Clientes Cadastrados
      </h2>

      <form className="flex flex-col sm:flex-row gap-3 mb-3" onSubmit={handleSearch}>
        <Input
          type="text"
          placeholder="Buscar por nome"
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          className="w-full"
        />
        <Button type="submit" className="h-10 w-full sm:w-auto">Buscar</Button>
        <Button type="button" variant="outline" onClick={handleClearSearch} className="h-10 w-full sm:w-auto">
          Limpar busca
        </Button>
      </form>

      {queryError ? <small className="text-red-500 text-xs">{queryError}</small> : null}
      {deleteError ? <small className="text-red-500 text-xs">{deleteError}</small> : null}

      {isLoading ? (
        <ul className="m-0 p-0 list-none">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            <li key={i}><ClientCardSkeleton /></li>
          ))}
        </ul>
      ) : null}

      {!isLoading && !queryError && rows.length === 0 ? (
        <p>Nenhum cliente encontrado.</p>
      ) : null}

      {!isLoading && !queryError && rows.length > 0 ? (
        <>
          <ul className="m-0 p-0 list-none">
            {rows.map((client) => (
              <ClientCardItem
                key={client.id}
                clientId={client.id}
                nome={client.nome}
                sexo={client.sexo}
                dataNascimento={client.data_nascimento}
                isDeleting={isDeleting && deletingId === client.id}
                onEdit={() => handleEditOpen(client)}
                onDelete={() => handleDelete(client)}
              />
            ))}
          </ul>

          <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 px-2 sm:px-4 text-xs sm:text-sm"
              onClick={handlePreviousPage}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <span className="min-w-0 text-center text-xs sm:text-sm text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
              Pagina {page} de {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-2 sm:px-4 text-xs sm:text-sm"
              onClick={handleNextPage}
              disabled={page >= totalPages}
            >
              Proxima
            </Button>
          </div>
        </>
      ) : null}

      {editingClient ? (
        <EditClientModal
          client={editingClient}
          isSaving={isSavingEdit}
          onSave={handleEditSave}
          onClose={handleEditClose}
        />
      ) : null}
    </section>
  )
}
