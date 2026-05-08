import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowDown, ArrowUp, Scale, Sparkles, Target, Trophy } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Line, Column } from '@ant-design/plots'
import { BackgroundLightning } from '@/components/home/BackgroundLightning'
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

interface MetricRow {
  label: string
  unit: string
  improveWhen: Trend
  values: Array<number | undefined>
}

interface ChartPoint {
  date: string
  metric: string
  value: number
}

interface ComparePoint {
  metric: string
  period: string
  value: number
}

interface GoalProgress {
  label: string
  currentText: string
  targetText: string
  progress: number
}

const MAX_COMPARE_SELECTION = 4

function toDateValue(avaliacao: Avaliacao): number {
  if (!avaliacao.dataAvaliacao) return 0
  return new Date(`${avaliacao.dataAvaliacao}T00:00:00`).getTime()
}

function formatValue(value: number | undefined, unit: string, digits = 1): string {
  if (value == null) return '-'
  return `${value.toFixed(digits)} ${unit}`
}

function formatDelta(first: number | undefined, last: number | undefined, unit: string, digits = 1): string {
  if (first == null || last == null) return '-'
  const delta = last - first
  const signal = delta > 0 ? '+' : ''
  return `${signal}${delta.toFixed(digits)} ${unit}`
}

function getTrend(first: number | undefined, last: number | undefined): Trend {
  if (first == null || last == null) return 'neutral'
  if (last > first) return 'up'
  if (last < first) return 'down'
  return 'neutral'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getTrendText(trend: Trend, improveWhen: Trend): { text: string; className: string } {
  if (trend === 'neutral') {
    return { text: 'Estavel', className: 'text-gray-300' }
  }

  const isImprovement = trend === improveWhen
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

  const selectedIds = useMemo(() => {
    const ids = (idsParam ?? '')
      .split(',')
      .map((id) => Number.parseInt(id.trim(), 10))
      .filter((id) => Number.isFinite(id))

    return Array.from(new Set(ids)).slice(0, MAX_COMPARE_SELECTION)
  }, [idsParam])

  const validSelection = selectedIds.length >= 2 && selectedIds.length <= MAX_COMPARE_SELECTION

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

  const ordered = useMemo(() => {
    if (!validSelection) return []

    return avaliacoes
      .filter((item) => selectedIds.includes(item.id))
      .sort((a, b) => toDateValue(a) - toDateValue(b))
  }, [avaliacoes, selectedIds, validSelection])

  const dataLoaded = ordered.length === selectedIds.length
  const first = ordered[0]
  const last = ordered[ordered.length - 1]

  const daysBetween = useMemo(() => {
    if (!first || !last) return 0
    const ms = toDateValue(last) - toDateValue(first)
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
  }, [first, last])

  const kpiCards = useMemo(() => {
    if (!first || !last) return []

    return [
      {
        title: 'Periodo analisado',
        value: `${daysBetween} dias`,
        helper: `${ordered.length} avaliacoes`,
      },
      {
        title: 'Delta gordura',
        value: formatDelta(first.percentualGordura, last.percentualGordura, '%', 2),
        helper: `${formatValue(first.percentualGordura, '%', 2)} -> ${formatValue(last.percentualGordura, '%', 2)}`,
      },
      {
        title: 'Delta massa magra',
        value: formatDelta(first.massaMagraKg, last.massaMagraKg, 'kg', 2),
        helper: `${formatValue(first.massaMagraKg, 'kg', 2)} -> ${formatValue(last.massaMagraKg, 'kg', 2)}`,
      },
      {
        title: 'Delta cintura',
        value: formatDelta(first.cintura, last.cintura, 'cm', 1),
        helper: `${formatValue(first.cintura, 'cm', 1)} -> ${formatValue(last.cintura, 'cm', 1)}`,
      },
      {
        title: 'Delta abdomen',
        value: formatDelta(first.abdomen, last.abdomen, 'cm', 1),
        helper: `${formatValue(first.abdomen, 'cm', 1)} -> ${formatValue(last.abdomen, 'cm', 1)}`,
      },
    ]
  }, [daysBetween, first, last, ordered.length])

  const bodyChartData = useMemo<ChartPoint[]>(() => {
    if (!ordered.length) return []

    const rows: ChartPoint[] = []
    for (const item of ordered) {
      const date = formatDateBR(item.dataAvaliacao)
      rows.push({ date, metric: 'Gordura %', value: item.percentualGordura })
      rows.push({ date, metric: 'Massa Magra (kg)', value: item.massaMagraKg })
      rows.push({ date, metric: 'Massa Gordura (kg)', value: item.massaGorduraKg })
      rows.push({ date, metric: 'Peso (kg)', value: item.peso })
    }
    return rows
  }, [ordered])

  const measureChartData = useMemo<ChartPoint[]>(() => {
    if (!ordered.length) return []

    const rows: ChartPoint[] = []
    for (const item of ordered) {
      const date = formatDateBR(item.dataAvaliacao)
      if (item.cintura != null) rows.push({ date, metric: 'Cintura (cm)', value: item.cintura })
      if (item.abdomen != null) rows.push({ date, metric: 'Abdomen (cm)', value: item.abdomen })
      if (item.quadril != null) rows.push({ date, metric: 'Quadril (cm)', value: item.quadril })
      if (item.torax != null) rows.push({ date, metric: 'Torax (cm)', value: item.torax })
      if (item.ombro != null) rows.push({ date, metric: 'Ombro (cm)', value: item.ombro })
    }
    return rows
  }, [ordered])

  const comparisonBars = useMemo<ComparePoint[]>(() => {
    if (!first || !last) return []

    return [
      { metric: 'Gordura %', period: 'Primeira', value: first.percentualGordura },
      { metric: 'Gordura %', period: 'Ultima', value: last.percentualGordura },
      { metric: 'Massa Magra', period: 'Primeira', value: first.massaMagraKg },
      { metric: 'Massa Magra', period: 'Ultima', value: last.massaMagraKg },
      { metric: 'Massa Gordura', period: 'Primeira', value: first.massaGorduraKg },
      { metric: 'Massa Gordura', period: 'Ultima', value: last.massaGorduraKg },
      { metric: 'Peso', period: 'Primeira', value: first.peso },
      { metric: 'Peso', period: 'Ultima', value: last.peso },
      { metric: 'Cintura', period: 'Primeira', value: first.cintura ?? 0 },
      { metric: 'Cintura', period: 'Ultima', value: last.cintura ?? 0 },
      { metric: 'Abdomen', period: 'Primeira', value: first.abdomen ?? 0 },
      { metric: 'Abdomen', period: 'Ultima', value: last.abdomen ?? 0 },
    ]
  }, [first, last])

  const premiumScore = useMemo(() => {
    if (!first || !last) return 0

    const gorduraScore =
      first.percentualGordura > 0
        ? clamp(((first.percentualGordura - last.percentualGordura) / first.percentualGordura) * 100, -30, 30)
        : 0
    const massaMagraScore =
      first.massaMagraKg > 0
        ? clamp(((last.massaMagraKg - first.massaMagraKg) / first.massaMagraKg) * 100, -30, 30)
        : 0

    const cinturaScore =
      first.cintura != null && last.cintura != null && first.cintura > 0
        ? clamp(((first.cintura - last.cintura) / first.cintura) * 100, -20, 20)
        : 0

    const consistencyScore = ordered.length >= 3 ? 10 : 5
    return Math.round(clamp(55 + gorduraScore + massaMagraScore + cinturaScore + consistencyScore, 0, 100))
  }, [first, last, ordered.length])

  const scoreLabel = useMemo(() => {
    if (premiumScore >= 80) return 'Excelente'
    if (premiumScore >= 65) return 'Muito bom'
    if (premiumScore >= 50) return 'Em progresso'
    return 'Atencao'
  }, [premiumScore])

  const gaugeRadius = 30
  const gaugeCircumference = 2 * Math.PI * gaugeRadius
  const gaugeOffset = gaugeCircumference - (premiumScore / 100) * gaugeCircumference

  const strategicGoals = useMemo<GoalProgress[]>(() => {
    if (!first || !last) return []

    const goals: GoalProgress[] = []

    const gorduraTarget = first.percentualGordura * 0.95
    const gorduraProgress =
      first.percentualGordura > gorduraTarget
        ? ((first.percentualGordura - last.percentualGordura) / (first.percentualGordura - gorduraTarget)) * 100
        : 0

    goals.push({
      label: 'Reducao de gordura corporal',
      currentText: formatValue(last.percentualGordura, '%', 2),
      targetText: `${gorduraTarget.toFixed(2)} %`,
      progress: clamp(gorduraProgress, 0, 100),
    })

    const massaMagraTarget = first.massaMagraKg * 1.03
    const massaMagraProgress =
      massaMagraTarget > first.massaMagraKg
        ? ((last.massaMagraKg - first.massaMagraKg) / (massaMagraTarget - first.massaMagraKg)) * 100
        : 0

    goals.push({
      label: 'Ganho de massa magra',
      currentText: formatValue(last.massaMagraKg, 'kg', 2),
      targetText: `${massaMagraTarget.toFixed(2)} kg`,
      progress: clamp(massaMagraProgress, 0, 100),
    })

    if (first.cintura != null && last.cintura != null) {
      const cinturaTarget = Math.max(0, first.cintura - 2)
      const cinturaProgress =
        first.cintura > cinturaTarget
          ? ((first.cintura - last.cintura) / (first.cintura - cinturaTarget)) * 100
          : 0

      goals.push({
        label: 'Reducao de cintura',
        currentText: formatValue(last.cintura, 'cm', 1),
        targetText: `${cinturaTarget.toFixed(1)} cm`,
        progress: clamp(cinturaProgress, 0, 100),
      })
    }

    return goals
  }, [first, last])

  const criticalPoints = useMemo(() => {
    if (ordered.length < 2) return []

    const alerts = new Set<string>()
    for (let i = 1; i < ordered.length; i += 1) {
      const prev = ordered[i - 1]
      const next = ordered[i]

      if (next.percentualGordura - prev.percentualGordura > 1) {
        alerts.add('Percentual de gordura subiu mais de 1 ponto em uma janela de avaliacao.')
      }
      if (prev.massaMagraKg - next.massaMagraKg > 0.7) {
        alerts.add('Massa magra caiu acima de 0.7kg entre avaliacoes consecutivas.')
      }
      if (next.cintura != null && prev.cintura != null && next.cintura - prev.cintura >= 2) {
        alerts.add('Cintura aumentou 2cm ou mais em pelo menos um intervalo.')
      }
      if (next.abdominal - prev.abdominal >= 2) {
        alerts.add('Dobra abdominal aumentou ao menos 2mm em um intervalo.')
      }
    }

    return Array.from(alerts)
  }, [ordered])

  const metricRows = useMemo<MetricRow[]>(() => {
    if (!ordered.length) return []

    return [
      {
        label: 'Percentual de gordura',
        unit: '%',
        improveWhen: 'down',
        values: ordered.map((item) => item.percentualGordura),
      },
      {
        label: 'Massa magra',
        unit: 'kg',
        improveWhen: 'up',
        values: ordered.map((item) => item.massaMagraKg),
      },
      {
        label: 'Massa gordura',
        unit: 'kg',
        improveWhen: 'down',
        values: ordered.map((item) => item.massaGorduraKg),
      },
      {
        label: 'Peso',
        unit: 'kg',
        improveWhen: 'neutral',
        values: ordered.map((item) => item.peso),
      },
      {
        label: 'Cintura',
        unit: 'cm',
        improveWhen: 'down',
        values: ordered.map((item) => item.cintura),
      },
      {
        label: 'Abdomen',
        unit: 'cm',
        improveWhen: 'down',
        values: ordered.map((item) => item.abdomen),
      },
      {
        label: 'Quadril',
        unit: 'cm',
        improveWhen: 'neutral',
        values: ordered.map((item) => item.quadril),
      },
      {
        label: 'Torax',
        unit: 'cm',
        improveWhen: 'up',
        values: ordered.map((item) => item.torax),
      },
      {
        label: 'Ombro',
        unit: 'cm',
        improveWhen: 'up',
        values: ordered.map((item) => item.ombro),
      },
      {
        label: 'Triceps',
        unit: 'mm',
        improveWhen: 'down',
        values: ordered.map((item) => item.triceps),
      },
      {
        label: 'Subescapular',
        unit: 'mm',
        improveWhen: 'down',
        values: ordered.map((item) => item.subescapular),
      },
      {
        label: 'Abdominal',
        unit: 'mm',
        improveWhen: 'down',
        values: ordered.map((item) => item.abdominal),
      },
    ]
  }, [ordered])

  if (!numericClientId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">Cliente nao encontrado.</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(169,255,46,0.16),transparent_40%),radial-gradient(circle_at_100%_0%,rgba(70,255,215,0.08),transparent_35%),linear-gradient(180deg,#080d09_0%,#0f1410_100%)] p-3 sm:p-4 md:p-6 overflow-hidden">
      <BackgroundLightning />
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(`/admin/cliente/${numericClientId}`)}
            className="text-[#a9ff2e] h-10"
          >
            ← Voltar para historico
          </Button>
          <div className="text-right">
            <h1 className="font-bebas font-medium tracking-tight text-2xl sm:text-3xl text-[#e9ffca]">
              Dashboard Comparativo
            </h1>
            <p className="text-xs text-gray-300">{cliente?.nome ?? 'Cliente'} • ate 4 avaliacoes</p>
          </div>
        </div>

        <Card className="overflow-hidden border-[rgba(169,255,46,0.35)]">
          <CardContent className="p-0">
            <div className="bg-[linear-gradient(120deg,rgba(169,255,46,0.15),rgba(70,255,215,0.08),rgba(255,255,255,0.01))] p-5 sm:p-6">
              <div className="flex flex-col gap-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#a9ff2e]">Visao executiva do cliente</p>
                <h2 className="font-bebas text-2xl sm:text-3xl text-[#efffd2] leading-tight">
                  Evolucao corporal em linha do tempo com foco em composicao e medidas
                </h2>
                <div className="flex flex-wrap gap-2">
                  {ordered.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full border border-[rgba(169,255,46,0.35)] bg-[rgba(169,255,46,0.12)] px-3 py-1 text-xs text-[#d8ffe8]"
                    >
                      {formatDateBR(item.dataAvaliacao)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!validSelection && (
          <Card className="p-5">
            <p className="text-red-300 text-sm">Selecione de 2 a 4 avaliacoes no historico para abrir o comparativo.</p>
          </Card>
        )}

        {validSelection && !dataLoaded && !isLoading && (
          <Card className="p-5">
            <p className="text-red-300 text-sm">
              Nao foi possivel carregar todas as avaliacoes selecionadas. Tente novamente pelo historico.
            </p>
          </Card>
        )}

        {ordered.length >= 2 && (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              <Card className="xl:col-span-1 p-4 sm:p-5 border-[rgba(169,255,46,0.45)] bg-[linear-gradient(145deg,rgba(169,255,46,0.18),rgba(58,26,12,0.2),rgba(255,255,255,0.03))]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#d8ffe8]">Score premium</p>
                    <h3 className="font-bebas text-xl text-[#f7ffd9]">Indice de evolucao</h3>
                  </div>
                  <Sparkles className="h-5 w-5 text-[#a9ff2e]" />
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative h-20 w-20 aspect-square shrink-0">
                    <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden="true">
                      <circle cx="40" cy="40" r={gaugeRadius} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="8" />
                      <circle
                        cx="40"
                        cy="40"
                        r={gaugeRadius}
                        fill="none"
                        stroke="#a9ff2e"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={gaugeCircumference}
                        strokeDashoffset={gaugeOffset}
                      />
                    </svg>
                    <div className="absolute inset-0 m-auto h-14 w-14 aspect-square shrink-0 rounded-full bg-[#0d120f] grid place-items-center text-[#efffd4] font-bold border border-[rgba(255,255,255,0.12)]">
                      {premiumScore}
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#d8ffe8]">{scoreLabel}</p>
                    <p className="text-xs text-gray-300">Baseado em gordura, massa magra, cintura e consistencia.</p>
                  </div>
                </div>
              </Card>

              <Card className="xl:col-span-2 p-4 sm:p-5 border-[rgba(92,227,255,0.3)] bg-[linear-gradient(135deg,rgba(92,227,255,0.1),rgba(18,40,55,0.25),rgba(255,255,255,0.02))]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#b5eaff]">Plano estrategico</p>
                    <h3 className="font-bebas text-xl text-[#e2f7ff]">Metas de composicao</h3>
                  </div>
                  <Target className="h-5 w-5 text-[#8edfff]" />
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {strategicGoals.map((goal) => (
                    <div key={goal.label} className="rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(7,17,20,0.55)] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-[#d8ffe8]">{goal.label}</p>
                        <span className="text-xs text-[#8edfff]">{goal.progress.toFixed(0)}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-[rgba(255,255,255,0.12)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#45d2ff,#a9ff2e)]"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-gray-300">Atual: {goal.currentText}</span>
                        <span className="text-gray-400">Meta: {goal.targetText}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {kpiCards.map((card) => (
                <Card key={card.title} className="p-4 bg-[linear-gradient(180deg,rgba(169,255,46,0.08),rgba(255,255,255,0.02))] border-[rgba(169,255,46,0.25)] shadow-[0_0_0_1px_rgba(169,255,46,0.08),0_12px_30px_rgba(0,0,0,0.3)]">
                  <p className="text-xs text-gray-300 uppercase tracking-wide">{card.title}</p>
                  <p className="text-2xl font-bold text-[#e8ffd4] mt-1">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.helper}</p>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
              <Card className="xl:col-span-3">
                <CardHeader className="pb-2">
                  <h2 className="font-bebas font-medium tracking-tight text-xl text-[#d8ffe8]">Composicao corporal no tempo</h2>
                </CardHeader>
                <CardContent>
                  <div style={{ height: '320px' }}>
                    <Line
                      data={bodyChartData}
                      xField="date"
                      yField="value"
                      seriesField="metric"
                      smooth
                      point={{ size: 5, shape: 'circle' }}
                      color={['#a9ff2e', '#d8ffe8', '#59ffd2', '#ffdf8a']}
                      lineStyle={{ lineWidth: 2 }}
                      legend={{ position: 'bottom' as const, layout: 'horizontal' as const }}
                      tooltip={{ showTitle: true }}
                      theme="dark"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:col-span-2 border-[rgba(255,120,120,0.3)]">
                <CardHeader className="pb-2">
                  <h2 className="font-bebas font-medium tracking-tight text-xl text-[#d8ffe8]">Pontos criticos</h2>
                </CardHeader>
                <CardContent>
                  {criticalPoints.length === 0 ? (
                    <div className="rounded-xl border border-[rgba(169,255,46,0.3)] bg-[rgba(169,255,46,0.1)] p-3 text-sm text-[#d8ffe8] flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-[#a9ff2e]" />
                      Sem alertas relevantes na janela selecionada.
                    </div>
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
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <h2 className="font-bebas font-medium tracking-tight text-xl text-[#d8ffe8]">Grafico das medidas (cm)</h2>
                </CardHeader>
                <CardContent>
                  {measureChartData.length === 0 ? (
                    <p className="text-sm text-gray-300">Nao ha medidas em cm suficientes para montar este grafico.</p>
                  ) : (
                    <div style={{ height: '320px' }}>
                      <Line
                        data={measureChartData}
                        xField="date"
                        yField="value"
                        seriesField="metric"
                        smooth
                        point={{ size: 5, shape: 'circle' }}
                        color={['#4dff9d', '#45d2ff', '#ffc76b', '#f398ff']}
                        lineStyle={{ lineWidth: 2 }}
                        legend={{ position: 'bottom' as const, layout: 'horizontal' as const }}
                        tooltip={{ showTitle: true }}
                        theme="dark"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <h2 className="font-bebas font-medium tracking-tight text-xl text-[#d8ffe8]">Primeira vs ultima avaliacao</h2>
                </CardHeader>
                <CardContent>
                  <div style={{ height: '320px' }}>
                    <Column
                      data={comparisonBars}
                      xField="metric"
                      yField="value"
                      seriesField="period"
                      isGroup
                      color={['#5ce3ff', '#a9ff2e']}
                      legend={{ position: 'bottom' as const, layout: 'horizontal' as const }}
                      tooltip={{ showTitle: true }}
                      theme="dark"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <h2 className="font-bebas font-medium tracking-tight text-xl text-[#d8ffe8]">Matriz comparativa completa</h2>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[900px]">
                    <thead>
                      <tr className="text-left border-b border-[rgba(169,255,46,0.25)] text-gray-300">
                        <th className="py-2 pr-3">Indicador</th>
                        {ordered.map((item) => (
                          <th key={item.id} className="py-2 pr-3">{formatDateBR(item.dataAvaliacao)}</th>
                        ))}
                        <th className="py-2 pr-3">Delta total</th>
                        <th className="py-2 pr-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricRows.map((row) => {
                        const firstValue = row.values[0]
                        const lastValue = row.values[row.values.length - 1]
                        const trend = getTrend(firstValue, lastValue)
                        const trendText = getTrendText(trend, row.improveWhen)
                        const trendIcon =
                          trend === 'up' ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : trend === 'down' ? (
                            <ArrowDown className="h-4 w-4" />
                          ) : (
                            <Scale className="h-4 w-4" />
                          )

                        return (
                          <tr key={row.label} className="border-b border-[rgba(255,255,255,0.06)]">
                            <td className="py-2 pr-3 text-[#d8ffe8]">{row.label}</td>
                            {row.values.map((value, index) => (
                              <td key={`${row.label}-${ordered[index].id}`} className="py-2 pr-3 text-gray-300">
                                {formatValue(value, row.unit, 2)}
                              </td>
                            ))}
                            <td className="py-2 pr-3 text-gray-300">{formatDelta(firstValue, lastValue, row.unit, 2)}</td>
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
