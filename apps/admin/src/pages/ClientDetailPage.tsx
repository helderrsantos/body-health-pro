import { BodyCompositionCalculator } from '@/components/BodyCompositionCalculator'
import { EditClient } from '@/components/EditClient'
import { EvaluationHistory } from '@/components/EvaluationHistory'
import { BackgroundLightning } from '@/components/home/BackgroundLightning'
import { Button } from '@/components/ui/button'
import { useAvaliacoes } from '@/hooks/useAvaliacoes'
import { supabase } from '@/lib/supabase'
import type { Avaliacao } from '@/services/avaliacoes/avaliacoes.service'
import { formatDateBR } from '@/utils/date'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'


export function ClientDetailPage() {
  const { clienteId } = useParams<{ clienteId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const numericClientId = clienteId ? Number.parseInt(clienteId, 10) : null
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === '1')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
    sexo: 'masculino' as 'masculino' | 'feminino',
  })
  const [editingAvaliacao, setEditingAvaliacao] = useState<Avaliacao | null>(null)
  const [deletingAvaliacaoId, setDeletingAvaliacaoId] = useState<number | null>(null)

  const { data: cliente, isLoading, refetch } = useQuery({
    queryKey: ['cliente', numericClientId],
    queryFn: async () => {
      if (!numericClientId) return null
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, data_nascimento, sexo, telefone, email')
        .eq('id', numericClientId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!numericClientId,
  })

  const { avaliacoes, deleteAvaliacao: deleteAvaliacaoMutation, isDeleting } = useAvaliacoes({
    clienteId: numericClientId ?? undefined,
  })

  async function handleSaveClient() {
    if (!numericClientId) return

    setIsSaving(true)
    setSaveError(null)
    setSaveMessage(null)

    const { error } = await supabase
      .from('clientes')
      .update({
        nome: formData.nome.trim() || cliente?.nome,
        data_nascimento: formData.dataNascimento || cliente?.data_nascimento,
        sexo: formData.sexo || cliente?.sexo,
      })
      .eq('id', numericClientId)

    setIsSaving(false)

    if (error) {
      setSaveError('Não foi possível atualizar os dados do cliente.')
      return
    }

    await refetch()
    setSaveMessage('Dados atualizados com sucesso.')
    setIsEditing(false)
  }

  async function handleDeleteAvaliacao(avaliacaoId: number) {
    if (!confirm('Tem certeza que deseja deletar esta avaliação?')) return

    setDeletingAvaliacaoId(avaliacaoId)
    try {
      await deleteAvaliacaoMutation(avaliacaoId)
    } catch (error) {
      console.error('Erro ao deletar avaliação:', error)
      alert('Erro ao deletar avaliação. Tente novamente.')
    } finally {
      setDeletingAvaliacaoId(null)
    }
  }

  function handleEditAvaliacao(avaliacao: Avaliacao) {
    setEditingAvaliacao(avaliacao)
    const calculatorSection = document.querySelector('[data-calculator-section]')
    calculatorSection?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleCompareAvaliacoes(avaliacaoIds: number[]) {
    if (!numericClientId || avaliacaoIds.length < 2 || avaliacaoIds.length > 4) return
    navigate(`/admin/cliente/${numericClientId}/comparativo?ids=${avaliacaoIds.join(',')}`)
  }

  if (!numericClientId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">Cliente não encontrado.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#d8ffe8]">Carregando cliente...</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0a0e0a] via-[#0f1410] to-[#0a0e0a] p-3 sm:p-4 md:p-6 overflow-hidden">
      <BackgroundLightning />
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="ghost" onClick={() => navigate('/admin')} className="text-[#a9ff2e] flex justify-start h-10">
            ← Voltar
          </Button>
          <div className="text-center flex-1">
            <h1 className="font-bebas font-medium tracking-tight text-xl sm:text-2xl text-[#d8ffe8]">
              {cliente?.nome}
            </h1>
            <p className="text-xs text-gray-400 mt-1">Nascimento: {formatDateBR(cliente?.data_nascimento)}</p>
          </div>
          <div className="w-12 hidden sm:block" />
        </div>

        <EditClient
          cliente={cliente || null}
          isEditing={isEditing}
          formData={formData}
          saveError={saveError}
          saveMessage={saveMessage}
          isSaving={isSaving}
          setIsEditing={setIsEditing}
          setFormData={setFormData}
          setSaveError={setSaveError}
          setSaveMessage={setSaveMessage}
          handleSaveClient={handleSaveClient}
        />

        {avaliacoes && avaliacoes.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bebas font-medium tracking-tight text-xl text-[#d8ffe8] mb-4">
              Histórico de Avaliações
            </h2>
            <EvaluationHistory
              avaliacoes={avaliacoes}
              onEdit={handleEditAvaliacao}
              onDelete={handleDeleteAvaliacao}
              onCompare={handleCompareAvaliacoes}
              isDeleting={isDeleting}
              deletingId={deletingAvaliacaoId ?? undefined}
            />
          </div>
        )}

        <div className="bg-[rgba(9,16,12,0.86)] rounded-2xl p-6 border border-[rgba(169,255,46,0.2)]" data-calculator-section>
          <h2 className="font-bebas font-medium tracking-tight text-xl text-[#d8ffe8] mb-4">
            {editingAvaliacao ? 'Editar Avaliação' : 'Nova Avaliação'}
          </h2>
          {editingAvaliacao && (
            <div className="mb-4 p-3 bg-[rgba(169,255,46,0.1)] rounded-xl border border-[rgba(169,255,46,0.2)]">
              <p className="text-sm text-[#d8ffe8]">
                Editando avaliação de{' '}
                {editingAvaliacao.dataAvaliacao
                  ? new Date(editingAvaliacao.dataAvaliacao + 'T00:00:00').toLocaleDateString('pt-BR')
                  : 'data desconhecida'}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditingAvaliacao(null)}
                className="mt-2"
              >
                Cancelar Edição
              </Button>
            </div>
          )}
          <BodyCompositionCalculator
            clienteId={numericClientId}
            clienteSexo={cliente?.sexo}
            editingAvaliacao={editingAvaliacao}
            onAvaliacaoSaved={() => {
              setEditingAvaliacao(null)
            }}
          />
        </div>
      </div>
    </div>
  )
}
