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

    const selectedAvaliacoes = avaliacoes
      .filter((a) => selectedIds.has(a.id))
      .sort(
        (a, b) =>
          new Date(b.dataAvaliacao || '').getTime() - new Date(a.dataAvaliacao || '').getTime(),
      )
      .reverse()

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 12
      const contentWidth = pageWidth - margin * 2

      // Função para criar gráfico via canvas
      const createChartImage = async (
        type: 'line' | 'bar',
        labels: string[],
        data: number[],
        title: string,
        color: string,
      ): Promise<string> => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const canvas = document.createElement('canvas')
            canvas.width = 1200
            canvas.height = 450

            new Chart(canvas, {
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
              } as any,
            })

            setTimeout(() => {
              resolve(canvas.toDataURL('image/png', 1.0))
            }, 300)
          }, 100)
        })
      }

      // Se seleção única, gerar relatório individual
      if (selectedAvaliacoes.length === 1) {
        const avaliacao = selectedAvaliacoes[0]

        let yPosition = margin

        // Header com background
        doc.setFillColor(249, 250, 251)
        doc.rect(0, 0, pageWidth, 45, 'F')
        
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(169, 255, 46)
        doc.text('Body Health Pro', margin + 2, yPosition + 10)
        
        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        doc.text('Relatório de Avaliação Corporal', margin + 2, yPosition + 20)
        
        yPosition = 50

        // Info badges
        const avaliacaoDate = avaliacao.dataAvaliacao
          ? new Date(avaliacao.dataAvaliacao).toLocaleDateString('pt-BR')
          : 'N/A'
        const exportDate = new Date().toLocaleDateString('pt-BR')
        
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`Avaliação: ${avaliacaoDate}`, margin, yPosition)
        doc.text(`Gerado em: ${exportDate}`, pageWidth - margin - 60, yPosition)
        yPosition += 10

        // Decorative line
        doc.setDrawColor(169, 255, 46)
        doc.setLineWidth(1.5)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 12

        // Gráfico de composição (Doughnut - QUADRADO)
        const canvas1 = document.createElement('canvas')
        const doughnutSize = 420
        canvas1.width = doughnutSize
        canvas1.height = doughnutSize

        new Chart(canvas1, {
          type: 'doughnut',
          data: {
            labels: ['Massa Gorda', 'Massa Magra'],
            datasets: [
              {
                data: [avaliacao.massaGorduraKg, avaliacao.massaMagraKg],
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
                labels: {
                  color: '#333',
                  font: { size: 13, weight: 'bold' },
                  padding: 15,
                  usePointStyle: true,
                },
              },
              title: {
                display: true,
                text: 'COMPOSIÇÃO CORPORAL (kg)',
                color: '#1a1a1a',
                font: { size: 13, weight: 'bold' },
                padding: 15,
              },
            },
          } as any,
        })

        await new Promise((resolve) => setTimeout(resolve, 500))
        const img1 = canvas1.toDataURL('image/png', 1.0)
        
        // Posiciona doughnut no centro
        const doughnutWidth = 70
        const doughnutLeft = (pageWidth - doughnutWidth) / 2
        doc.addImage(img1, 'PNG', doughnutLeft, yPosition, doughnutWidth, doughnutWidth)
        yPosition += doughnutWidth + 12

        // Cards com dados principais
        const cardHeight = 18
        const cardWidth = (contentWidth - 8) / 3
        const cardsY = yPosition
        
        // Card 1: Peso
        doc.setFillColor(240, 253, 244)
        doc.rect(margin, cardsY, cardWidth, cardHeight, 'F')
        doc.setDrawColor(76, 175, 80)
        doc.setLineWidth(0.5)
        doc.rect(margin, cardsY, cardWidth, cardHeight)
        
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text('Peso (kg)', margin + 3, cardsY + 5)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(76, 175, 80)
        doc.text(avaliacao.peso.toFixed(2), margin + 3, cardsY + 12)

        // Card 2: Gordura %
        doc.setFillColor(254, 240, 240)
        doc.rect(margin + cardWidth + 4, cardsY, cardWidth, cardHeight, 'F')
        doc.setDrawColor(255, 107, 107)
        doc.setLineWidth(0.5)
        doc.rect(margin + cardWidth + 4, cardsY, cardWidth, cardHeight)
        
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text('Gordura (%)', margin + cardWidth + 7, cardsY + 5)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 107, 107)
        doc.text(avaliacao.percentualGordura.toFixed(2), margin + cardWidth + 7, cardsY + 12)

        // Card 3: Altura
        doc.setFillColor(240, 246, 255)
        doc.rect(margin + (cardWidth + 4) * 2, cardsY, cardWidth, cardHeight, 'F')
        doc.setDrawColor(100, 150, 200)
        doc.setLineWidth(0.5)
        doc.rect(margin + (cardWidth + 4) * 2, cardsY, cardWidth, cardHeight)
        
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text('Altura (cm)', margin + (cardWidth + 4) * 2 + 3, cardsY + 5)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(66, 133, 244)
        doc.text(avaliacao.altura ? avaliacao.altura.toFixed(1) : 'N/A', margin + (cardWidth + 4) * 2 + 3, cardsY + 12)

        yPosition += cardHeight + 15

        // Gráfico de dobras (Bar) - melhorado
        const canvas2 = document.createElement('canvas')
        canvas2.width = 1200
        canvas2.height = 380

        new Chart(canvas2, {
          type: 'bar',
          data: {
            labels: ['Peitoral', 'Abdominal', 'Coxa', 'Axilar', 'Subesc.', 'Suprailíaca', 'Tríceps'],
            datasets: [
              {
                label: 'Dobras Cutâneas (mm)',
                data: [
                  avaliacao.peitoral,
                  avaliacao.abdominal,
                  avaliacao.coxa,
                  avaliacao.axilarMedia,
                  avaliacao.subescapular,
                  avaliacao.suprailiaca,
                  avaliacao.triceps,
                ],
                backgroundColor: '#a9ff2e',
                borderColor: '#90ee00',
                borderWidth: 2,
                borderRadius: 5,
              },
            ],
          },
          options: {
            responsive: false,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            plugins: {
              legend: { display: true, labels: { color: '#333', font: { size: 12, weight: 'bold' }, padding: 12 } },
              title: {
                display: true,
                text: 'DISTRIBUIÇÃO DAS DOBRAS CUTÂNEAS (mm)',
                color: '#1a1a1a',
                font: { size: 13, weight: 'bold' },
                padding: 15,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { color: '#666', font: { size: 11 } },
                grid: { color: '#e0e0e0' },
              },
              x: { ticks: { color: '#666', font: { size: 11 } }, grid: { display: false } },
            },
          } as any,
        })

        await new Promise((resolve) => setTimeout(resolve, 500))
        const img2 = canvas2.toDataURL('image/png', 1.0)

        if (yPosition > pageHeight - 110) {
          doc.addPage()
          yPosition = margin
        }
        doc.addImage(img2, 'PNG', margin, yPosition, contentWidth, 70)
        yPosition += 80

        // Nova página para resumo
        doc.addPage()
        yPosition = margin

        // Header página 2
        doc.setFillColor(249, 250, 251)
        doc.rect(0, 0, pageWidth, 30, 'F')
        
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(169, 255, 46)
        doc.text('RESUMO DETALHADO', margin + 2, yPosition + 12)
        
        yPosition = 38

        // Decorative line
        doc.setDrawColor(169, 255, 46)
        doc.setLineWidth(1.5)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 8

        // Seção 1: Dados Principales
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(25, 25, 25)
        doc.text('DADOS PRINCIPAIS', margin, yPosition)
        yPosition += 6

        const tableData1 = [
          ['Peso', `${avaliacao.peso.toFixed(2)} kg`, 'Altura', avaliacao.altura ? `${avaliacao.altura.toFixed(1)} cm` : 'N/A'],
          ['Gordura %', `${avaliacao.percentualGordura.toFixed(2)}%`, 'Massa Magra', `${avaliacao.massaMagraKg.toFixed(2)} kg`],
          ['Massa Gorda', `${avaliacao.massaGorduraKg.toFixed(2)} kg`, 'IMC', avaliacao.altura ? `${(avaliacao.peso / ((avaliacao.altura / 100) ** 2)).toFixed(2)}` : 'N/A'],
        ]

        ;(doc as any).autoTable({
          head: [['Métrica', 'Valor', 'Métrica', 'Valor']],
          body: tableData1,
          startY: yPosition,
          margin: margin,
          tableWidth: contentWidth,
          theme: 'grid',
          headStyles: {
            fillColor: [169, 255, 46],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 10,
          },
          bodyStyles: {
            fontSize: 9,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
        })

        yPosition = (doc as any).lastAutoTable.finalY + 12

        // Seção 2: Dobras Cutâneas
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(25, 25, 25)
        doc.text('DOBRAS CUTÂNEAS (mm)', margin, yPosition)
        yPosition += 6

        const tableData2 = [
          ['Peitoral', avaliacao.peitoral.toFixed(1), 'Axilar Média', avaliacao.axilarMedia.toFixed(1), 'Suprailíaca', avaliacao.suprailiaca.toFixed(1)],
          ['Abdominal', avaliacao.abdominal.toFixed(1), 'Subescapular', avaliacao.subescapular.toFixed(1), 'Tríceps', avaliacao.triceps.toFixed(1)],
          ['Coxa', avaliacao.coxa.toFixed(1), '', '', '', ''],
        ]

        ;(doc as any).autoTable({
          head: [['Local', 'Valor', 'Local', 'Valor', 'Local', 'Valor']],
          body: tableData2,
          startY: yPosition,
          margin: margin,
          tableWidth: contentWidth,
          theme: 'grid',
          headStyles: {
            fillColor: [169, 255, 46],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 10,
          },
          bodyStyles: {
            fontSize: 9,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
        })

        yPosition = (doc as any).lastAutoTable.finalY + 12

        // Seção 3: Medidas Antropométricas
        const medidas = [
          avaliacao.ombro && ['Ombro', avaliacao.ombro.toFixed(1)],
          avaliacao.torax && ['Tórax', avaliacao.torax.toFixed(1)],
          avaliacao.cintura && ['Cintura', avaliacao.cintura.toFixed(1)],
          avaliacao.abdomen && ['Abdômen', avaliacao.abdomen.toFixed(1)],
          avaliacao.quadril && ['Quadril', avaliacao.quadril.toFixed(1)],
        ].filter(Boolean) as string[][]

        if (medidas.length > 0 && yPosition < pageHeight - 60) {
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(25, 25, 25)
          doc.text('MEDIDAS ANTROPOMÉTRICAS (cm)', margin, yPosition)
          yPosition += 6

          const tableData3 = []
          for (let i = 0; i < medidas.length; i += 2) {
            tableData3.push([
              medidas[i][0],
              medidas[i][1],
              medidas[i + 1] ? medidas[i + 1][0] : '',
              medidas[i + 1] ? medidas[i + 1][1] : '',
            ])
          }

          ;(doc as any).autoTable({
            head: [['Medida', 'Valor (cm)', 'Medida', 'Valor (cm)']],
            body: tableData3,
            startY: yPosition,
            margin: margin,
            tableWidth: contentWidth,
            theme: 'grid',
            headStyles: {
              fillColor: [169, 255, 46],
              textColor: [0, 0, 0],
              fontStyle: 'bold',
              fontSize: 10,
            },
            bodyStyles: {
              fontSize: 9,
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252],
            },
          })
        }
      } else {
        // Comparativo com múltiplas avaliações
        let yPosition = margin

        // Header com background
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
          .map((a) =>
            a.dataAvaliacao ? new Date(a.dataAvaliacao).toLocaleDateString('pt-BR') : 'N/A',
          )
          .join(' - ')
        
        const exportDate = new Date().toLocaleDateString('pt-BR')
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`Período: ${datesStr} | Gerado em: ${exportDate}`, margin, yPosition)
        yPosition += 7

        // Decorative line
        doc.setDrawColor(169, 255, 46)
        doc.setLineWidth(1.5)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 8

        // Preparar dados dos gráficos
        const datesLabels = selectedAvaliacoes.map((a) =>
          a.dataAvaliacao ? new Date(a.dataAvaliacao).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }) : 'N/A',
        )

        const gorduraData = selectedAvaliacoes.map((a) => a.percentualGordura)
        const massaMagraData = selectedAvaliacoes.map((a) => a.massaMagraKg)
        const massaGorduraData = selectedAvaliacoes.map((a) => a.massaGorduraKg)
        const pesoData = selectedAvaliacoes.map((a) => a.peso)

        try {
          // Gráfico 1: Gordura
          const chartGordura = await createChartImage('line', datesLabels, gorduraData, 'Evolução Gordura %', '#a9ff2e')
          doc.addImage(chartGordura, 'PNG', margin, yPosition, contentWidth, 50)
          yPosition += 55

          // Gráfico 2a: Massa Magra
          const canvas2a = document.createElement('canvas')
          canvas2a.width = 600
          canvas2a.height = 350

          new Chart(canvas2a, {
            type: 'line',
            data: {
              labels: datesLabels,
              datasets: [
                {
                  label: 'Massa Magra (kg)',
                  data: massaMagraData,
                  borderColor: '#4ade80',
                  backgroundColor: 'rgba(74, 222, 128, 0.1)',
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
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
            } as any,
          })

          await new Promise((resolve) => setTimeout(resolve, 400))
          const img2a = canvas2a.toDataURL('image/png', 1.0)

          // Gráfico 2b: Massa Gorda
          const canvas2b = document.createElement('canvas')
          canvas2b.width = 600
          canvas2b.height = 350

          new Chart(canvas2b, {
            type: 'line',
            data: {
              labels: datesLabels,
              datasets: [
                {
                  label: 'Massa Gorda (kg)',
                  data: massaGorduraData,
                  borderColor: '#ff6b6b',
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
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
            } as any,
          })

          await new Promise((resolve) => setTimeout(resolve, 400))
          const img2b = canvas2b.toDataURL('image/png', 1.0)

          // Gráficos lado a lado
          doc.addImage(img2a, 'PNG', margin, yPosition, (contentWidth - 4) / 2, 52)
          doc.addImage(img2b, 'PNG', margin + (contentWidth - 4) / 2 + 4, yPosition, (contentWidth - 4) / 2, 52)
          yPosition += 58

          // Gráfico 3: Peso
          const chartPeso = await createChartImage('bar', datesLabels, pesoData, 'Evolução Peso (kg)', '#a9ff2e')
          doc.addImage(chartPeso, 'PNG', margin, yPosition, contentWidth, 50)
          yPosition += 60

          // Gráfico 4: Composição final (Doughnut)
          const lastAvaliacao = selectedAvaliacoes[selectedAvaliacoes.length - 1]
          const canvas4 = document.createElement('canvas')
          const doughnutSize = 380
          canvas4.width = doughnutSize
          canvas4.height = doughnutSize

          new Chart(canvas4, {
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
            } as any,
          })

          await new Promise((resolve) => setTimeout(resolve, 500))
          const img4 = canvas4.toDataURL('image/png', 1.0)

          if (yPosition > pageHeight - 120) {
            doc.addPage()
            yPosition = margin
          }

          const doughnutWidth = 65
          const doughnutLeft = (pageWidth - doughnutWidth) / 2
          doc.addImage(img4, 'PNG', doughnutLeft, yPosition, doughnutWidth, doughnutWidth)
          yPosition += doughnutWidth + 10

          // Tabela comparativa detalhada
          if (yPosition > pageHeight - 100) {
            doc.addPage()
            yPosition = margin
          }

          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(169, 255, 46)
          doc.text('DADOS COMPARATIVOS', margin, yPosition)
          yPosition += 6

          const tableData: (string | number)[][] = selectedAvaliacoes.map((avaliacao) => [
            avaliacao.dataAvaliacao ? new Date(avaliacao.dataAvaliacao).toLocaleDateString('pt-BR') : 'N/A',
            avaliacao.peso.toFixed(2),
            avaliacao.percentualGordura.toFixed(2),
            avaliacao.massaMagraKg.toFixed(2),
            avaliacao.massaGorduraKg.toFixed(2),
            avaliacao.altura ? avaliacao.altura.toFixed(1) : 'N/A',
            (avaliacao.altura ? (avaliacao.peso / ((avaliacao.altura / 100) ** 2)).toFixed(2) : 'N/A'),
          ])

          ;(doc as any).autoTable({
            head: [['Data', 'Peso (kg)', 'Gordura %', 'M. Magra (kg)', 'M. Gorda (kg)', 'Altura (cm)', 'IMC']],
            body: tableData,
            startY: yPosition,
            margin: margin,
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

          yPosition = (doc as any).lastAutoTable.finalY + 10

          // Tabela de dobras cutâneas
          if (yPosition > pageHeight - 80) {
            doc.addPage()
            yPosition = margin
          }

          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(169, 255, 46)
          doc.text('DOBRAS CUTÂNEAS (mm)', margin, yPosition)
          yPosition += 5

          const dobraTableData: (string | number)[][] = selectedAvaliacoes.map((avaliacao) => [
            avaliacao.dataAvaliacao ? new Date(avaliacao.dataAvaliacao).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }) : 'N/A',
            avaliacao.peitoral.toFixed(1),
            avaliacao.abdominal.toFixed(1),
            avaliacao.coxa.toFixed(1),
            avaliacao.axilarMedia.toFixed(1),
            avaliacao.subescapular.toFixed(1),
            avaliacao.suprailiaca.toFixed(1),
            avaliacao.triceps.toFixed(1),
          ])

          ;(doc as any).autoTable({
            head: [['Data', 'Peitoral', 'Abdominal', 'Coxa', 'Axilar', 'Subesc.', 'Suprailíaca', 'Tríceps']],
            body: dobraTableData,
            startY: yPosition,
            margin: margin,
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

          yPosition = (doc as any).lastAutoTable.finalY + 10

          // Resumo de evolução com mais detalhes
          if (yPosition < pageHeight - 80) {
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(169, 255, 46)
            doc.text('RESUMO DE EVOLUÇÃO', margin, yPosition)
            yPosition += 6

            doc.setFont('helvetica', 'normal')
            doc.setTextColor(0, 0, 0)
            doc.setFontSize(9)

            const primeiraAvaliacao = selectedAvaliacoes[0]
            const ultimaAvaliacao = selectedAvaliacoes[selectedAvaliacoes.length - 1]

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

            // Criar 2 colunas de dados
            const col1_x = margin + 5
            const col2_x = margin + contentWidth / 2 + 5

            // Coluna 1
            doc.text(`Período: ${selectedAvaliacoes.length} avaliações`, col1_x, yPosition)
            yPosition += 5

            doc.text(`Peso: ${formatDiff(variacaoPeso)} kg ${formatPercent(variacaoPeso / primeiraAvaliacao.peso)}`, col1_x, yPosition)
            yPosition += 5

            doc.text(`Gordura: ${formatDiff(variacaoGordura)}%`, col1_x, yPosition)
            yPosition += 5

            doc.text(`Massa Magra: ${formatDiff(variacaoMassaMagra)} kg`, col1_x, yPosition)
            yPosition += 5

            doc.text(`Massa Gorda: ${formatDiff(variacaoMassaGordura)} kg`, col1_x, yPosition)

            // Coluna 2
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

      const filename = `avaliacoes-${Date.now()}.pdf`
      doc.save(filename)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF. Verifique o console.')
    }
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
                    avaliacao.abdomen ||
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
                        {avaliacao.abdomen && (
                          <div>
                            <p className="text-gray-400 text-xs">Abdomen</p>
                            <p className="text-[#d8ffe8] font-semibold">{avaliacao.abdomen.toFixed(1)} cm</p>
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
                ? 'Selecione de 1 a 4 avaliações para gerar PDF'
                : selectedIds.size > MAX_COMPARE_SELECTION
                  ? `Máximo ${MAX_COMPARE_SELECTION} avaliações permitidas`
                  : `${selectedIds.size} avaliação(ões) selecionada(s)`}
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

