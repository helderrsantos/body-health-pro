import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useClientsList } from '@/hooks/useClientsList'
import { useAvaliacoes } from '@/hooks/useAvaliacoes'
import type { ClientsListProps } from '@/types/client'

function formatDateBR(dateString: string): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString + 'T00:00:00')
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return dateString
  }
}

interface ClientItemProps {
  clientId: number
  nome: string
  sexo: string
  dataNascimento: string
  onDelete: () => void
  isDeleting: boolean
}

function ClientCardItem({
  clientId,
  nome,
  sexo,
  dataNascimento,
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
        <strong className="text-[#eafff1]">{nome}</strong>
        <p className="text-gray-400 text-sm mt-1">
          Sexo: {sexo} | Data nascimento: {formatDateBR(dataNascimento)}
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

      <div className="flex justify-end gap-2 mt-1">
        <Button
          type="button"
          variant="destructive"
          className="h-10"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          disabled={isDeleting}
          isLoading={isDeleting}
          showLoadingText={false}
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

      {isLoading ? <p>Carregando clientes...</p> : null}
      {queryError ? <small className="text-red-500 text-xs">{queryError}</small> : null}
      {deleteError ? <small className="text-red-500 text-xs">{deleteError}</small> : null}
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
    </section>
  )
}
