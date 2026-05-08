import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowDown, ArrowUp, Scale } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAvaliacoes } from '@/hooks/useAvaliacoes'
import { supabase } from '@/lib/supabase'
import type { Avaliacao } from '@/services/avaliacoes/avaliacoes.service'
import { formatDateBR } from '@/utils/date'

interface ClientDetail {
  id: number
  nome: string
}

type Trend = 'up' | 'down' | 'neutral'

interface CompareMetric {
  label: string
  unit: string
  prev: number | undefined
  next: number | undefined
  trend: Trend
  improveWhen: 'up' | 'down' | 'neutral'
}

function toDateValue(avaliacao: Avaliacao): number {
  if (!avaliacao.dataAvaliacao) return 0
  return new Date(`${avaliacao.dataAvaliacao}T00:00:00`).getTime()
}

function buildMetric(
  label: string,
  unit: string,
  prev: number | undefined,
  next: number | undefined,
  improveWhen: 'up' | 'down' | 'neutral',
): CompareMetric {
  if (prev == null || next == null) {
    return { label, unit, prev, next, trend: 'neutral', improveWhen }
  }

  const delta = next - prev
  return {
    label,
    unit,
    prev,
    next,
    trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral',
    improveWhen,
  }
}

function formatValue(value: number | undefined, unit: string, digits = 1): string {
  if (value == null) return '-'
  return `${value.toFixed(digits)} ${unit}`
}

function formatDelta(prev: number | undefined, next: number | undefined, unit: string, digits = 1): string {
  if (prev == null || next == null) return '-'
  const delta = next - prev
  const signal = delta > 0 ? '+' : ''
  return `${signal}${delta.toFixed(digits)} ${unit}`
}

function getTrendText(metric: CompareMetric): { text: string; className: string } {
  if (metric.prev == null || metric.next == null || metric.trend === 'neutral') {
    return { text: 'Estavel', className: 'text-gray-300' }
  }

  const isImprovement = metric.trend === metric.improveWhen
  return {
    text: isImprovement ? 'Melhora' : 'Atencao',
    className: isImprovement ? 'text-[#a9ff2e]' : 'text-[#ff9a9a]',
  }
}

export function EvaluationComparisonPage() {
  const navigate = useNavigate()
  const { clienteId } = useParams<{ clienteId: string }>()
  const [searchParams] = useSearchParams()

  const numericClientId = clienteId ? Number.parseInt(clienteId, 10) : null
  const idsParam = searchParams.get('ids')
  const selectedIds = useMemo(
    () =>
      (idsParam ?? '')
        .split(',')
        .map((id) => Number.parseInt(id.trim(), 10))
        .filter((id) => Number.isFinite(id)),
    [idsParam],
  )

  const { data: cliente } = useQuery({
    queryKey: ['cliente', numericClientId, 'comparison'],
    queryFn: async () => {
      if (!numericClientId) return null
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('id', numericClientId)
        .single()

      if (error) throw error
      return data as ClientDetail
    },
    enabled: !!numericClientId,
  })

  const { avaliacoes, isLoading } = useAvaliacoes({ clienteId: numericClientId ?? undefined })

  const selectedAvaliacoes = useMemo(() => {
    if (selectedIds.length !== 2) return []
    return avaliacoes.filter((item) => selectedIds.includes(item.id))
  }, [avaliacoes, selectedIds])

  const ordered = useMemo(() => {
    if (selectedAvaliacoes.length !== 2) return null
    const [first, second] = selectedAvaliacoes
    return toDateValue(first) <= toDateValue(second) ? [first, second] : [second, first]
  }, [selectedAvaliacoes])

  const metrics = useMemo(() => {
    if (!ordered) return []

    const [prev, next] = ordered
    return [
      buildMetric('Percentual de gordura', '%', prev.percentualGordura, next.percentualGordura, 'down'),
      buildMetric('Massa magra', 'kg', prev.massaMagraKg, next.massaMagraKg, 'up'),
      buildMetric('Massa de gordura', 'kg', prev.massaGorduraKg, next.massaGorduraKg, 'down'),
      buildMetric('Peso', 'kg', prev.peso, next.peso, 'neutral'),
      buildMetric('Triceps', 'mm', prev.triceps, next.triceps, 'down'),
      buildMetric('Subescapular', 'mm', prev.subescapular, next.subescapular, 'down'),
      buildMetric('Abdominal', 'mm', prev.abdominal, next.abdominal, 'down'),
      buildMetric('Cintura', 'cm', prev.cintura, next.cintura, 'down'),
      buildMetric('Quadril', 'cm', prev.quadril, next.quadril, 'neutral'),
      buildMetric('Torax', 'cm', prev.torax, next.torax, 'up'),
    ]
  }, [ordered])

  const criticalPoints = useMemo(() => {
    if (!ordered) return []
    const [prev, next] = ordered
    const items: string[] = []

    if (next.percentualGordura - prev.percentualGordura > 1) {
      items.push('Percentual de gordura aumentou mais de 1 ponto percentual.')
    }

    if (prev.massaMagraKg - next.massaMagraKg > 0.5) {
      items.push('Massa magra reduziu acima de 0.5kg.')
    }

    if (next.cintura != null && prev.cintura != null && next.cintura - prev.cintura >= 2) {
      items.push('Circunferencia da cintura aumentou 2cm ou mais.')
    }

    if (next.abdominal - prev.abdominal >= 2) {
      items.push('Dobra abdominal aumentou pelo menos 2mm.')
    }

    return items
  }, [ordered])

  if (!numericClientId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">Cliente nao encontrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e0a] via-[#0f1410] to-[#0a0e0a] p-3 sm:p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(`/admin/cliente/${numericClientId}`)}
            className="text-[#a9ff2e] h-10"
          >
            ← Voltar para historico
          </Button>
          <div className="text-right">
            <h1 className="font-bebas font-medium tracking-tight text-2xl text-[#d8ffe8]">
              Comparativo de Avaliacoes
            </h1>
            <p className="text-xs text-gray-400">{cliente?.nome ?? 'Cliente'}</p>
          </div>
        </div>

        {selectedIds.length !== 2 && (
          <Card className="p-5">
            <p className="text-red-300 text-sm">
              Selecione exatamente 2 avaliacoes no historico para abrir o comparativo.
            </p>
          </Card>
        )}

        {selectedIds.length === 2 && selectedAvaliacoes.length !== 2 && !isLoading && (
          <Card className="p-5">
            <p className="text-red-300 text-sm">
              Nao foi possivel carregar as avaliacoes selecionadas. Tente novamente pelo historico.
            </p>
          </Card>
        )}

        {ordered && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="p-4 bg-[rgba(169,255,46,0.1)] border-[rgba(169,255,46,0.25)]">
                <p className="text-xs text-gray-300">De</p>
                <p className="text-[#d8ffe8] font-semibold">{formatDateBR(ordered[0].dataAvaliacao)}</p>
                <p className="text-xs text-gray-300 mt-2">Para</p>
                <p className="text-[#d8ffe8] font-semibold">{formatDateBR(ordered[1].dataAvaliacao)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-gray-400">Evolucao gordura</p>
                <p className="text-2xl font-bold text-[#d8ffe8]">
                  {formatDelta(ordered[0].percentualGordura, ordered[1].percentualGordura, '%', 2)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-gray-400">Evolucao massa magra</p>
                <p className="text-2xl font-bold text-[#d8ffe8]">
                  {formatDelta(ordered[0].massaMagraKg, ordered[1].massaMagraKg, 'kg', 2)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-gray-400">Evolucao peso</p>
                <p className="text-2xl font-bold text-[#d8ffe8]">
                  {formatDelta(ordered[0].peso, ordered[1].peso, 'kg', 2)}
                </p>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <h2 className="font-bebas font-medium tracking-tight text-xl text-[#d8ffe8]">Pontos Criticos</h2>
              </CardHeader>
              <CardContent>
                {criticalPoints.length === 0 ? (
                  <p className="text-[#a9ff2e] text-sm">Sem alertas relevantes no periodo comparado.</p>
                ) : (
                  <div className="space-y-2">
                    {criticalPoints.map((point) => (
                      <div
                        key={point}
                        className="flex items-start gap-2 rounded-lg border border-[rgba(255,120,120,0.35)] bg-[rgba(120,20,20,0.25)] p-3"
                      >
                        <AlertTriangle className="h-4 w-4 text-[#ffb1b1] mt-0.5" />
                        <p className="text-sm text-[#ffd4d4]">{point}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <h2 className="font-bebas font-medium tracking-tight text-xl text-[#d8ffe8]">Comparacao Completa</h2>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-[rgba(169,255,46,0.25)] text-gray-300">
                        <th className="py-2 pr-3">Indicador</th>
                        <th className="py-2 pr-3">Anterior</th>
                        <th className="py-2 pr-3">Atual</th>
                        <th className="py-2 pr-3">Delta</th>
                        <th className="py-2 pr-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((metric) => {
                        const trendText = getTrendText(metric)
                        const trendIcon =
                          metric.trend === 'up' ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : metric.trend === 'down' ? (
                            <ArrowDown className="h-4 w-4" />
                          ) : (
                            <Scale className="h-4 w-4" />
                          )

                        return (
                          <tr key={metric.label} className="border-b border-[rgba(255,255,255,0.06)]">
                            <td className="py-2 pr-3 text-[#d8ffe8]">{metric.label}</td>
                            <td className="py-2 pr-3 text-gray-300">{formatValue(metric.prev, metric.unit, 2)}</td>
                            <td className="py-2 pr-3 text-gray-300">{formatValue(metric.next, metric.unit, 2)}</td>
                            <td className="py-2 pr-3 text-gray-300">
                              {formatDelta(metric.prev, metric.next, metric.unit, 2)}
                            </td>
                            <td className="py-2 pr-3">
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${trendText.className}`}>
                                {trendIcon}
                                {trendText.text}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
