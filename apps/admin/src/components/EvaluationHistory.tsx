import { useState } from 'react'
import { ChevronDown, Edit2, Trash2, FileText, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CheckboxComponent } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Avaliacao } from '@/services/avaliacoes/avaliacoes.service'

interface EvaluationHistoryProps {
  avaliacoes: Avaliacao[]
  onEdit: (avaliacao: Avaliacao) => void
  onDelete: (avaliacaoId: number) => void
  isDeleting?: boolean
  deletingId?: number
}

function formatDateBRShort(dateString: string): string {
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

interface ExpandedStateMap {
  [key: number]: boolean
}

export function EvaluationHistory({
  avaliacoes,
  onEdit,
  onDelete,
  isDeleting = false,
  deletingId,
}: Readonly<EvaluationHistoryProps>) {
  const [expandedMap, setExpandedMap] = useState<ExpandedStateMap>({})
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  function toggleExpanded(avaliacaoId: number) {
    setExpandedMap((prev) => ({
      ...prev,
      [avaliacaoId]: !prev[avaliacaoId],
    }))
  }

  function toggleSelected(avaliacaoId: number) {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(avaliacaoId)) {
        newSet.delete(avaliacaoId)
      } else {
        newSet.add(avaliacaoId)
      }
      return newSet
    })
  }

  function handleGeneratePDF() {
    if (selectedIds.size === 0) return
    // TODO: Implementar geração de PDF
    console.log('Gerar PDF para avaliações:', Array.from(selectedIds))
    alert('Funcionalidade de PDF será implementada em breve')
  }

  function handleCompareEvaluations() {
    if (selectedIds.size !== 2) return
    // TODO: Implementar comparativo
    console.log('Comparar avaliações:', Array.from(selectedIds))
    alert('Funcionalidade de comparativo será implementada em breve')
  }

  if (avaliacoes.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-400 text-sm">Nenhuma avaliação registrada ainda.</p>
      </Card>
    )
  }

  // Sort by date descending (newest first)
  const sortedAvaliacoes = [...avaliacoes].sort(
    (a, b) =>
      new Date(b.dataAvaliacao || '').getTime() - new Date(a.dataAvaliacao || '').getTime(),
  )

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {sortedAvaliacoes.map((avaliacao) => {
          const isExpanded = expandedMap[avaliacao.id] ?? false
          const isSelected = selectedIds.has(avaliacao.id)

          return (
            <Card key={avaliacao.id} className="overflow-hidden">
              {/* Header/Collapsed View */}
              <CardHeader className="p-3 sm:p-4 hover:bg-[rgba(169,255,46,0.05)] transition-colors flex flex-row items-center gap-3 sm:gap-4">
                {/* Checkbox */}
                <div className="w-5 flex items-center justify-center">
                <CheckboxComponent
                  checked={isSelected || false}
                  onCheckedChange={() => toggleSelected(avaliacao.id)}
                  title="Selecionar avaliação"
                />
                </div>

                {/* Expand Button */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(avaliacao.id)}
                  className="flex-1 flex items-center gap-4 text-left"
                >
                  <ChevronDown
                    className={`w-5 h-5 text-[#a9ff2e] transition-transform flex-shrink-0 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-[#d8ffe8]">
                      {avaliacao.dataAvaliacao
                        ? formatDateBRShort(avaliacao.dataAvaliacao)
                        : 'Data não definida'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Gordura: {avaliacao.percentualGordura.toFixed(2)}% | Magra:{' '}
                      {avaliacao.massaMagraKg.toFixed(2)} kg
                    </p>
                  </div>
                </button>
              </CardHeader>

              {/* Expanded View */}
              {isExpanded && (
                <CardContent className="border-t border-[rgba(169,255,46,0.2)] bg-[rgba(0,0,0,0.3)]">
                  <div className="mb-4 pb-4 border-b border-[rgba(169,255,46,0.2)]">
                    <p className="text-[#a9ff2e] text-xs font-semibold mb-3 uppercase">Dobras Cutâneas (mm)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
                      {/* Left Column */}
                      <div className="space-y-2">
                        <div>
                          <p className="text-gray-400 text-xs">Peso</p>
                          <p className="text-[#d8ffe8] font-semibold">{avaliacao.peso.toFixed(2)} kg</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Peitoral</p>
                          <p className="text-[#d8ffe8] font-semibold">{avaliacao.peitoral.toFixed(1)} mm</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Abdominal</p>
                          <p className="text-[#d8ffe8] font-semibold">{avaliacao.abdominal.toFixed(1)} mm</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Coxa</p>
                          <p className="text-[#d8ffe8] font-semibold">{avaliacao.coxa.toFixed(1)} mm</p>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-2">
                        <div>
                          <p className="text-gray-400 text-xs">Altura</p>
                          <p className="text-[#d8ffe8] font-semibold">{avaliacao.altura ? `${avaliacao.altura.toFixed(1)} cm` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Axilar Média</p>
                          <p className="text-[#d8ffe8] font-semibold">{avaliacao.axilarMedia.toFixed(1)} mm</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Subescapular</p>
                          <p className="text-[#d8ffe8] font-semibold">
                            {avaliacao.subescapular.toFixed(1)} mm
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Suprailíaca</p>
                          <p className="text-[#d8ffe8] font-semibold">{avaliacao.suprailiaca.toFixed(1)} mm</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Tríceps</p>
                          <p className="text-[#d8ffe8] font-semibold">{avaliacao.triceps.toFixed(1)} mm</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medidas em cm */}
                  {(avaliacao.ombro ||
                    avaliacao.torax ||
                    avaliacao.cintura ||
                    avaliacao.quadril ||
                    avaliacao.coxaDireita ||
                    avaliacao.coxaEsquerda ||
                    avaliacao.panturrilhaDireita ||
                    avaliacao.panturrilhaEsquerda ||
                    avaliacao.bracoDireito ||
                    avaliacao.bracoEsquerdo ||
                    avaliacao.antebracoDireito ||
                    avaliacao.antebracoEsquerdo ||
                    avaliacao.punhoDireito ||
                    avaliacao.punhoEsquerdo) && (
                    <div className="mb-4 pb-4 border-b border-[rgba(169,255,46,0.2)]">
                      <p className="text-[#a9ff2e] text-xs font-semibold mb-3 uppercase">Medidas Antropométricas (cm)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        {avaliacao.ombro && (
                          <div>
                            <p className="text-gray-400 text-xs">Ombro</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.ombro.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.torax && (
                          <div>
                            <p className="text-gray-400 text-xs">Torax</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.torax.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.cintura && (
                          <div>
                            <p className="text-gray-400 text-xs">Cintura</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.cintura.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.quadril && (
                          <div>
                            <p className="text-gray-400 text-xs">Quadril</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.quadril.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.coxaDireita && (
                          <div>
                            <p className="text-gray-400 text-xs">Coxa D</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.coxaDireita.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.coxaEsquerda && (
                          <div>
                            <p className="text-gray-400 text-xs">Coxa E</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.coxaEsquerda.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.panturrilhaDireita && (
                          <div>
                            <p className="text-gray-400 text-xs">Panturrilha D</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.panturrilhaDireita.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.panturrilhaEsquerda && (
                          <div>
                            <p className="text-gray-400 text-xs">Panturrilha E</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.panturrilhaEsquerda.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.bracoDireito && (
                          <div>
                            <p className="text-gray-400 text-xs">Braço D</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.bracoDireito.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.bracoEsquerdo && (
                          <div>
                            <p className="text-gray-400 text-xs">Braço E</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.bracoEsquerdo.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.antebracoDireito && (
                          <div>
                            <p className="text-gray-400 text-xs">Antebraço D</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.antebracoDireito.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.antebracoEsquerdo && (
                          <div>
                            <p className="text-gray-400 text-xs">Antebraço E</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.antebracoEsquerdo.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.punhoDireito && (
                          <div>
                            <p className="text-gray-400 text-xs">Punho D</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.punhoDireito.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.punhoEsquerdo && (
                          <div>
                            <p className="text-gray-400 text-xs">Punho E</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.punhoEsquerdo.toFixed(1)} cm</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3 mb-4">
                    <div className="bg-[rgba(169,255,46,0.15)] rounded-lg p-2">
                      <p className="text-gray-400 text-xs">Percentual Gordura</p>
                      <p className="text-[#dbff8b] font-bold">{avaliacao.percentualGordura.toFixed(2)}%</p>
                    </div>
                    <div className="bg-[rgba(78,14,14,0.3)] rounded-lg p-2">
                      <p className="text-gray-400 text-xs">Massa Gordura</p>
                      <p className="text-[#ff7b7b] font-bold">{avaliacao.massaGorduraKg.toFixed(2)} kg</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 w-full">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(avaliacao)}
                      className="h-10"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(avaliacao.id)}
                      disabled={isDeleting && deletingId === avaliacao.id}
                      isLoading={isDeleting && deletingId === avaliacao.id}
                      showLoadingText={false}
                      className="h-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Actions Section */}
      {sortedAvaliacoes.length > 0 && (
        <Card className="p-3 sm:p-4">
          <CardContent className="p-0">
            <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
              {selectedIds.size === 0
                ? 'Selecione avaliações acima para acessar as ações'
                : `${selectedIds.size} avaliação(ões) selecionada(s)`}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                type="button"
                size="sm"
                onClick={handleGeneratePDF}
                disabled={selectedIds.size === 0}
                className="w-full sm:flex-1 h-10"
              >
                <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Gerar PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCompareEvaluations}
                disabled={selectedIds.size !== 2}
                className="w-full sm:flex-1 h-10"
                title={
                  selectedIds.size !== 2 ? 'Selecione exatamente 2 avaliações para comparar' : undefined
                }
              >
                <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Comparar</span>
                <span className="sm:hidden">Comp.</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

