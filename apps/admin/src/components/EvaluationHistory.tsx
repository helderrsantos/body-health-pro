import { useState } from 'react'
import { ChevronDown, Edit2, Trash2, FileText, BarChart3 } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Chart, registerables } from 'chart.js'
import { Button } from '@/components/ui/button'
import { CheckboxComponent } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Avaliacao } from '@/services/avaliacoes/avaliacoes.service'

Chart.register(...registerables)

/** Extended jsPDF type with autoTable plugin methods and properties */
type jsPDFWithAutoTable = jsPDF & {
  autoTable: (options: Record<string, unknown>) => void
  lastAutoTable: { finalY: number }
}

interface EvaluationHistoryProps {
  avaliacoes: Avaliacao[]
  onEdit: (avaliacao: Avaliacao) => void
  onDelete: (avaliacaoId: number) => void
  onCompare?: (avaliacaoIds: number[]) => void
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value != null
}

function formatMeasurement(label: string, value: number | null | undefined): [string, string] | null {
  if (value == null) {
    return null
  }

  return [label, value.toFixed(1)]
}

function formatPairedMeasurement(
  label: string,
  left: number | null | undefined,
  right: number | null | undefined,
): [string, string, string] | null {
  if (left == null || right == null) {
    return null
  }

  return [label, left.toFixed(1), right.toFixed(1)]
}

function hasAnyMeasurement(avaliacao: Avaliacao): boolean {
  return [
    avaliacao.ombro,
    avaliacao.torax,
    avaliacao.cintura,
    avaliacao.abdomen,
    avaliacao.quadril,
    avaliacao.coxaDireita,
    avaliacao.coxaEsquerda,
    avaliacao.panturrilhaDireita,
    avaliacao.panturrilhaEsquerda,
    avaliacao.bracoDireito,
    avaliacao.bracoEsquerdo,
    avaliacao.antebracoDireito,
    avaliacao.antebracoEsquerdo,
    avaliacao.punhoDireito,
    avaliacao.punhoEsquerdo,
  ].some(isDefined)
}

async function createChartImage(
  type: 'line' | 'bar',
  labels: string[],
  data: number[],
  title: string,
  color: string,
): Promise<string> {
  await delay(100)

  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 450

  const chart = new Chart(canvas, {
    type,
    data: {
      labels,
      datasets: [
        {
          label: title,
          data,
          borderColor: color,
          backgroundColor: type === 'line' ? `${color}40` : color,
          borderWidth: 3,
          fill: type === 'line',
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      plugins: {
        legend: {
          display: true,
          labels: { color: '#333', font: { size: 14, weight: 'bold' } },
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: { color: '#666', font: { size: 12 } },
          grid: { color: '#ddd' },
        },
        x: {
          ticks: { color: '#666', font: { size: 12 } },
          grid: { color: '#ddd' },
        },
      },
    } as const,
  })

  await delay(300)
  const image = canvas.toDataURL('image/png', 1)
  chart.destroy()
  return image
}

type PdfDimensions = {
  pageWidth: number
  pageHeight: number
  margin: number
  contentWidth: number
}

function sortSelectedAvaliacoes(avaliacoes: Avaliacao[], selectedIds: Set<number>): Avaliacao[] {
  return avaliacoes
    .filter((avaliacao) => selectedIds.has(avaliacao.id))
    .sort(
      (a, b) =>
        new Date(b.dataAvaliacao || '').getTime() - new Date(a.dataAvaliacao || '').getTime(),
    )
    .reverse()
}

function createPdfDocument(): jsPDF {
  return new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })
}

function getPdfDimensions(doc: jsPDF): PdfDimensions {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12

  return {
    pageWidth,
    pageHeight,
    margin,
    contentWidth: pageWidth - margin * 2,
  }
}

// NOSONAR
async function renderSingleEvaluationSummary(doc: jsPDFWithAutoTable, avaliacao: Avaliacao, dims: PdfDimensions): Promise<void> {
  const { pageWidth, pageHeight, margin, contentWidth } = dims
  let yPosition = margin

  doc.addPage()
  doc.setFillColor(249, 250, 251)
  doc.rect(0, 0, pageWidth, 30, 'F')

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(169, 255, 46)
  doc.text('RESUMO DETALHADO', margin + 2, yPosition + 12)

  yPosition = 38
  doc.setDrawColor(169, 255, 46)
  doc.setLineWidth(1.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(25, 25, 25)
  doc.text('DADOS PRINCIPAIS', margin, yPosition)
  yPosition += 6

  doc.autoTable({
    head: [['Métrica', 'Valor', 'Métrica', 'Valor']],
    body: [
      ['Peso', `${avaliacao.peso.toFixed(2)} kg`, 'Altura', avaliacao.altura ? `${avaliacao.altura.toFixed(1)} cm` : 'N/A'],
      ['Gordura %', `${avaliacao.percentualGordura.toFixed(2)}%`, 'Massa Magra', `${avaliacao.massaMagraKg.toFixed(2)} kg`],
      ['Massa Gorda', `${avaliacao.massaGorduraKg.toFixed(2)} kg`, 'IMC', avaliacao.altura ? `${(avaliacao.peso / ((avaliacao.altura / 100) ** 2)).toFixed(2)}` : 'N/A'],
    ],
    startY: yPosition,
    margin,
    tableWidth: contentWidth,
    theme: 'grid',
    headStyles: { fillColor: [169, 255, 46], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  yPosition = doc.lastAutoTable.finalY + 12

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(25, 25, 25)
  doc.text('DOBRAS CUT�NEAS (mm)', margin, yPosition)
  yPosition += 6

  doc.autoTable({
    head: [['Local', 'Valor', 'Local', 'Valor', 'Local', 'Valor']],
    body: [
      ['Peitoral', avaliacao.peitoral.toFixed(1), 'Axilar Média', avaliacao.axilarMedia.toFixed(1), 'Suprailíaca', avaliacao.suprailiaca.toFixed(1)],
      ['Abdominal', avaliacao.abdominal.toFixed(1), 'Subescapular', avaliacao.subescapular.toFixed(1), 'Tríceps', avaliacao.triceps.toFixed(1)],
      ['Coxa', avaliacao.coxa.toFixed(1), '', '', '', ''],
    ],
    startY: yPosition,
    margin,
    tableWidth: contentWidth,
    theme: 'grid',
    headStyles: { fillColor: [169, 255, 46], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  yPosition = doc.lastAutoTable.finalY + 12

  const medidasSimples = [
    formatMeasurement('Ombro', avaliacao.ombro),
    formatMeasurement('Tórax', avaliacao.torax),
    formatMeasurement('Cintura', avaliacao.cintura),
    formatMeasurement('Abdômen', avaliacao.abdomen),
    formatMeasurement('Quadril', avaliacao.quadril),
  ].filter(isDefined)

  const medidasPares = [
    formatPairedMeasurement('Coxa', avaliacao.coxaDireita, avaliacao.coxaEsquerda),
    formatPairedMeasurement('Panturrilha', avaliacao.panturrilhaDireita, avaliacao.panturrilhaEsquerda),
    formatPairedMeasurement('Braço', avaliacao.bracoDireito, avaliacao.bracoEsquerdo),
    formatPairedMeasurement('Antebraço', avaliacao.antebracoDireito, avaliacao.antebracoEsquerdo),
    formatPairedMeasurement('Punho', avaliacao.punhoDireito, avaliacao.punhoEsquerdo),
  ].filter(isDefined)

  if ((medidasSimples.length > 0 || medidasPares.length > 0) && yPosition < pageHeight - 60) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(25, 25, 25)
    doc.text('MEDIDAS ANTROPOM�0TRICAS (cm)', margin, yPosition)
    yPosition += 5

    if (medidasSimples.length > 0) {
      const tableDataSimples: string[][] = []
      for (let i = 0; i < medidasSimples.length; i += 2) {
        tableDataSimples.push([
          medidasSimples[i][0],
          medidasSimples[i][1],
          medidasSimples[i + 1] ? medidasSimples[i + 1][0] : '',
          medidasSimples[i + 1] ? medidasSimples[i + 1][1] : '',
        ])
      }

      doc.autoTable({
        head: [['Medida', 'Valor', 'Medida', 'Valor']],
        body: tableDataSimples,
        startY: yPosition,
        margin,
        tableWidth: contentWidth,
        theme: 'grid',
        headStyles: { fillColor: [169, 255, 46], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      })

      yPosition = doc.lastAutoTable.finalY + 6
    }

    if (medidasPares.length > 0) {
      const tableDataPares = medidasPares.map((row) => [row[0], row[1], row[2]])

      doc.autoTable({
        head: [['Medida', 'Direita', 'Esquerda']],
        body: tableDataPares,
        startY: yPosition,
        margin,
        tableWidth: contentWidth,
        theme: 'grid',
        headStyles: { fillColor: [169, 255, 46], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      })
    }
  }
}

async function renderSingleEvaluationPdf(doc: jsPDFWithAutoTable, avaliacao: Avaliacao, dims: PdfDimensions): Promise<void> {
  await renderSingleEvaluationSummary(doc, avaliacao, dims)
}
async function renderComparativePdf(
  doc: jsPDFWithAutoTable,
  selectedAvaliacoes: Avaliacao[],
  dims: PdfDimensions,
): Promise<void> {
  const { pageWidth, pageHeight, margin, contentWidth } = dims
  let yPosition = margin

  doc.setFillColor(249, 250, 251)
  doc.rect(0, 0, pageWidth, 45, 'F')

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(169, 255, 46)
  doc.text('Body Health Pro', margin + 2, yPosition + 10)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text('Relatório Comparativo de Avaliações', margin + 2, yPosition + 20)

  yPosition = 50

  const datesStr = selectedAvaliacoes
    .map((avaliacao) =>
      avaliacao.dataAvaliacao ? new Date(avaliacao.dataAvaliacao).toLocaleDateString('pt-BR') : 'N/A',
    )
    .join(' - ')

  const exportDate = new Date().toLocaleDateString('pt-BR')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Período: ${datesStr} | Gerado em: ${exportDate}`, margin, yPosition)
  yPosition += 7

  doc.setDrawColor(169, 255, 46)
  doc.setLineWidth(1.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  const datesLabels = selectedAvaliacoes.map((avaliacao) =>
    avaliacao.dataAvaliacao
      ? new Date(avaliacao.dataAvaliacao).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
      : 'N/A',
  )

  const gorduraData = selectedAvaliacoes.map((avaliacao) => avaliacao.percentualGordura)
  const massaMagraData = selectedAvaliacoes.map((avaliacao) => avaliacao.massaMagraKg)
  const massaGorduraData = selectedAvaliacoes.map((avaliacao) => avaliacao.massaGorduraKg)
  const pesoData = selectedAvaliacoes.map((avaliacao) => avaliacao.peso)

  try {
    const chartGordura = await createChartImage('bar', datesLabels, gorduraData, 'Evolução Gordura %', '#a9ff2e')
    doc.addImage(chartGordura, 'PNG', margin, yPosition, contentWidth, 50)
    yPosition += 55

    const canvas2a = document.createElement('canvas')
    canvas2a.width = 600
    canvas2a.height = 350

    const chart2a = new Chart(canvas2a, {
      type: 'bar',
      data: {
        labels: datesLabels,
        datasets: [
          {
            label: 'Massa Magra (kg)',
            data: massaMagraData,
            borderColor: '#4ade80',
            backgroundColor: 'rgba(74, 222, 128, 0.75)',
            borderWidth: 1,
            borderRadius: 8,
            maxBarThickness: 32,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: {
          legend: { display: true, labels: { color: '#333', font: { size: 11, weight: 'bold' } } },
          title: { display: true, text: 'Massa Magra (kg)', color: '#1a1a1a', font: { size: 12, weight: 'bold' }, padding: 10 },
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#666', font: { size: 10 } }, grid: { color: '#e0e0e0' } },
          x: { ticks: { color: '#666', font: { size: 10 } }, grid: { display: false } },
        },
      } as const,
    })

    await delay(400)
    const img2a = canvas2a.toDataURL('image/png', 1)
    chart2a.destroy()

    const canvas2b = document.createElement('canvas')
    canvas2b.width = 600
    canvas2b.height = 350

    const chart2b = new Chart(canvas2b, {
      type: 'bar',
      data: {
        labels: datesLabels,
        datasets: [
          {
            label: 'Massa Gorda (kg)',
            data: massaGorduraData,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.75)',
            borderWidth: 1,
            borderRadius: 8,
            maxBarThickness: 32,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: {
          legend: { display: true, labels: { color: '#333', font: { size: 11, weight: 'bold' } } },
          title: { display: true, text: 'Massa Gorda (kg)', color: '#1a1a1a', font: { size: 12, weight: 'bold' }, padding: 10 },
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#666', font: { size: 10 } }, grid: { color: '#e0e0e0' } },
          x: { ticks: { color: '#666', font: { size: 10 } }, grid: { display: false } },
        },
      } as const,
    })

    await delay(400)
    const img2b = canvas2b.toDataURL('image/png', 1)
    chart2b.destroy()

    doc.addImage(img2a, 'PNG', margin, yPosition, (contentWidth - 4) / 2, 52)
    doc.addImage(img2b, 'PNG', margin + (contentWidth - 4) / 2 + 4, yPosition, (contentWidth - 4) / 2, 52)
    yPosition += 58

    const chartPeso = await createChartImage('bar', datesLabels, pesoData, 'Evolução Peso (kg)', '#a9ff2e')
    doc.addImage(chartPeso, 'PNG', margin, yPosition, contentWidth, 50)
    yPosition += 60

    const lastAvaliacao = selectedAvaliacoes.at(-1)
    if (!lastAvaliacao) {
      return
    }

    const canvas4 = document.createElement('canvas')
    const doughnutSize = 380
    canvas4.width = doughnutSize
    canvas4.height = doughnutSize

    const finalChart = new Chart(canvas4, {
      type: 'doughnut',
      data: {
        labels: ['Massa Gorda', 'Massa Magra'],
        datasets: [
          {
            data: [lastAvaliacao.massaGorduraKg, lastAvaliacao.massaMagraKg],
            backgroundColor: ['#ff6b6b', '#51cf66'],
            borderColor: ['#fff', '#fff'],
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: true,
        animation: { duration: 0 },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: '#333', font: { size: 11, weight: 'bold' }, padding: 12 },
          },
          title: {
            display: true,
            text: `Composição Final (${lastAvaliacao.dataAvaliacao ? new Date(lastAvaliacao.dataAvaliacao).toLocaleDateString('pt-BR') : 'N/A'})`,
            color: '#1a1a1a',
            font: { size: 12, weight: 'bold' },
            padding: 12,
          },
        },
      } as const,
    })

    await delay(500)
    const img4 = canvas4.toDataURL('image/png', 1)
    finalChart.destroy()

    if (yPosition > pageHeight - 120) {
      doc.addPage()
      yPosition = margin
    }

    const doughnutWidth = 65
    const doughnutLeft = (pageWidth - doughnutWidth) / 2
    doc.addImage(img4, 'PNG', doughnutLeft, yPosition, doughnutWidth, doughnutWidth)
    yPosition += doughnutWidth + 10

    if (yPosition > pageHeight - 100) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(169, 255, 46)
    doc.text('DADOS COMPARATIVOS', margin, yPosition)
    yPosition += 6

    const tableData = selectedAvaliacoes.map((avaliacao) => [
      avaliacao.dataAvaliacao ? new Date(avaliacao.dataAvaliacao).toLocaleDateString('pt-BR') : 'N/A',
      avaliacao.peso.toFixed(2),
      avaliacao.percentualGordura.toFixed(2),
      avaliacao.massaMagraKg.toFixed(2),
      avaliacao.massaGorduraKg.toFixed(2),
      avaliacao.altura ? avaliacao.altura.toFixed(1) : 'N/A',
      avaliacao.altura ? (avaliacao.peso / ((avaliacao.altura / 100) ** 2)).toFixed(2) : 'N/A',
    ])

    doc.autoTable({
      head: [['Data', 'Peso (kg)', 'Gordura %', 'M. Magra (kg)', 'M. Gorda (kg)', 'Altura (cm)', 'IMC']],
      body: tableData,
      startY: yPosition,
      margin,
      tableWidth: contentWidth,
      theme: 'grid',
      headStyles: {
        fillColor: [169, 255, 46],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    })

    yPosition = doc.lastAutoTable.finalY + 10

    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(169, 255, 46)
    doc.text('DOBRAS CUT�NEAS (mm)', margin, yPosition)
    yPosition += 5

    const dobraTableData = selectedAvaliacoes.map((avaliacao) => [
      avaliacao.dataAvaliacao ? new Date(avaliacao.dataAvaliacao).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }) : 'N/A',
      avaliacao.peitoral.toFixed(1),
      avaliacao.abdominal.toFixed(1),
      avaliacao.coxa.toFixed(1),
      avaliacao.axilarMedia.toFixed(1),
      avaliacao.subescapular.toFixed(1),
      avaliacao.suprailiaca.toFixed(1),
      avaliacao.triceps.toFixed(1),
    ])

    doc.autoTable({
      head: [['Data', 'Peitoral', 'Abdominal', 'Coxa', 'Axilar', 'Subesc.', 'Suprailíaca', 'Tríceps']],
      body: dobraTableData,
      startY: yPosition,
      margin,
      tableWidth: contentWidth,
      theme: 'grid',
      headStyles: {
        fillColor: [169, 255, 46],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      bodyStyles: {
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    })

    yPosition = doc.lastAutoTable.finalY + 10

    if (yPosition < pageHeight - 80) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(169, 255, 46)
      doc.text('RESUMO DE EVOLU�!ÒO', margin, yPosition)
      yPosition += 6

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)

      const primeiraAvaliacao = selectedAvaliacoes[0]
      const ultimaAvaliacao = selectedAvaliacoes.at(-1)

      if (!ultimaAvaliacao) {
        return
      }

      const variacaoPeso = ultimaAvaliacao.peso - primeiraAvaliacao.peso
      const variacaoGordura = ultimaAvaliacao.percentualGordura - primeiraAvaliacao.percentualGordura
      const variacaoMassaMagra = ultimaAvaliacao.massaMagraKg - primeiraAvaliacao.massaMagraKg
      const variacaoMassaGordura = ultimaAvaliacao.massaGorduraKg - primeiraAvaliacao.massaGorduraKg

      const formatDiff = (value: number) => {
        const sign = value > 0 ? '+' : ''
        return `${sign}${value.toFixed(2)}`
      }

      const formatPercent = (value: number) => {
        return value > 0 ? `(+) ${(Math.abs(value) * 100).toFixed(1)}%` : `(-) ${(Math.abs(value) * 100).toFixed(1)}%`
      }

      const col1_x = margin + 5
      const col2_x = margin + contentWidth / 2 + 5

      doc.text(`Período: ${selectedAvaliacoes.length} avaliações`, col1_x, yPosition)
      yPosition += 5
      doc.text(`Peso: ${formatDiff(variacaoPeso)} kg ${formatPercent(variacaoPeso / primeiraAvaliacao.peso)}`, col1_x, yPosition)
      yPosition += 5
      doc.text(`Gordura: ${formatDiff(variacaoGordura)}%`, col1_x, yPosition)
      yPosition += 5
      doc.text(`Massa Magra: ${formatDiff(variacaoMassaMagra)} kg`, col1_x, yPosition)
      yPosition += 5
      doc.text(`Massa Gorda: ${formatDiff(variacaoMassaGordura)} kg`, col1_x, yPosition)

      const initialY = yPosition - 20
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(169, 255, 46)
      doc.text('DADOS INICIAIS vs FINAIS', col2_x, initialY - 5)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(`Peso: ${primeiraAvaliacao.peso.toFixed(2)} - ${ultimaAvaliacao.peso.toFixed(2)} kg`, col2_x, initialY)
      doc.text(`Gordura: ${primeiraAvaliacao.percentualGordura.toFixed(2)}% - ${ultimaAvaliacao.percentualGordura.toFixed(2)}%`, col2_x, initialY + 5)
      doc.text(`M. Magra: ${primeiraAvaliacao.massaMagraKg.toFixed(2)} - ${ultimaAvaliacao.massaMagraKg.toFixed(2)} kg`, col2_x, initialY + 10)
      doc.text(`M. Gorda: ${primeiraAvaliacao.massaGorduraKg.toFixed(2)} - ${ultimaAvaliacao.massaGorduraKg.toFixed(2)} kg`, col2_x, initialY + 15)
    }
  } catch (chartError) {
    console.error('Erro ao gerar gráficos:', chartError)
  }
}

interface ExpandedStateMap {
  [key: number]: boolean
}

export function EvaluationHistory({
  avaliacoes,
  onEdit,
  onDelete,
  onCompare,
  isDeleting = false,
  deletingId,
}: Readonly<EvaluationHistoryProps>) {
  const MAX_COMPARE_SELECTION = 4
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
        if (newSet.size >= MAX_COMPARE_SELECTION) {
          return prev
        }
        newSet.add(avaliacaoId)
      }
      return newSet
    })
  }

  async function handleGeneratePDF() {
    if (selectedIds.size === 0 || selectedIds.size > MAX_COMPARE_SELECTION) return

    const selectedAvaliacoes = sortSelectedAvaliacoes(avaliacoes, selectedIds)
    const doc = createPdfDocument()
    const dims = getPdfDimensions(doc)

    if (selectedAvaliacoes.length === 1) {
      await renderSingleEvaluationPdf(doc as jsPDFWithAutoTable, selectedAvaliacoes[0], dims)
    } else {
      await renderComparativePdf(doc as jsPDFWithAutoTable, selectedAvaliacoes, dims)
    }

    doc.save(`avaliacoes-${Date.now()}.pdf`)
  }


  function handleCompareEvaluations() {
    if (selectedIds.size < 2 || selectedIds.size > MAX_COMPARE_SELECTION) return
    onCompare?.(Array.from(selectedIds))
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

  let selectionStatusText = 'Selecione de 1 a 4 avaliações para gerar PDF'

  if (selectedIds.size > MAX_COMPARE_SELECTION) {
    selectionStatusText = `Máximo ${MAX_COMPARE_SELECTION} avaliações permitidas`
  } else if (selectedIds.size > 0) {
    selectionStatusText = `${selectedIds.size} avaliação(ões) selecionada(s)`
  }

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
                  {hasAnyMeasurement(avaliacao) && (
                    <div className="mb-4 pb-4 border-b border-[rgba(169,255,46,0.2)]">
                      <p className="text-[#a9ff2e] text-xs font-semibold mb-3 uppercase">Medidas Antropométricas (cm)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        {avaliacao.ombro != null && (
                          <div>
                            <p className="text-gray-400 text-xs">Ombro</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.ombro.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.torax != null && (
                          <div>
                            <p className="text-gray-400 text-xs">Torax</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.torax.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.cintura != null && (
                          <div>
                            <p className="text-gray-400 text-xs">Cintura</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.cintura.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.abdomen != null && (
                          <div>
                            <p className="text-gray-400 text-xs">Abdomen</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.abdomen.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.quadril != null && (
                          <div>
                            <p className="text-gray-400 text-xs">Quadril</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.quadril.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.coxaDireita != null && (
                          <div>
                            <p className="text-gray-400 text-xs">Coxa D</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.coxaDireita.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.coxaEsquerda != null && (
                          <div>
                            <p className="text-gray-400 text-xs">Coxa E</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.coxaEsquerda.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.panturrilhaDireita != null && (
                          <div>
                            <p className="text-gray-400 text-xs">Panturrilha D</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.panturrilhaDireita.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.panturrilhaEsquerda != null && (
                          <div>
                            <p className="text-gray-400 text-xs">Panturrilha E</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.panturrilhaEsquerda.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.bracoDireito != null && (
                          <div>
                            <p className="text-gray-400 text-xs">Braço D</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.bracoDireito.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.bracoEsquerdo != null && (
                          <div>
                            <p className="text-gray-400 text-xs">Braço E</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.bracoEsquerdo.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.antebracoDireito != null && (
                          <div>
                            <p className="text-gray-400 text-xs">Antebraço D</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.antebracoDireito.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.antebracoEsquerdo != null && (
                          <div>
                            <p className="text-gray-400 text-xs">Antebraço E</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.antebracoEsquerdo.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.punhoDireito != null && (
                          <div>
                            <p className="text-gray-400 text-xs">Punho D</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.punhoDireito.toFixed(1)} cm</p>
                          </div>
                        )}
                        {avaliacao.punhoEsquerdo != null && (
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
              {selectionStatusText}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                type="button"
                size="sm"
                onClick={handleGeneratePDF}
                disabled={selectedIds.size === 0 || selectedIds.size > MAX_COMPARE_SELECTION}
                className="w-full sm:flex-1 h-10"
                title={
                  selectedIds.size > MAX_COMPARE_SELECTION
                    ? `Máximo ${MAX_COMPARE_SELECTION} avaliações para PDF`
                    : 'Gerar PDF com avaliação ou comparativo'
                }
              >
                <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  {selectedIds.size === 1 ? 'Gerar PDF' : 'PDF Comparativo'}
                </span>
                <span className="sm:hidden">PDF</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCompareEvaluations}
                disabled={selectedIds.size < 2 || selectedIds.size > MAX_COMPARE_SELECTION}
                className="w-full sm:flex-1 h-10"
                title={
                  selectedIds.size < 2 || selectedIds.size > MAX_COMPARE_SELECTION
                    ? 'Selecione de 2 a 4 avaliações para comparar'
                    : undefined
                }
              >
                <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Comp.</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

