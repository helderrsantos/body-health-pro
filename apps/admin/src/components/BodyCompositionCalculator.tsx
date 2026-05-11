import { zodResolver } from '@hookform/resolvers/zod'
import { calculateBodyComposition, type BodyCompositionSex, clientSchema } from '@bodyhealthpro/core'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { InputField, NumberInputField } from '@/components/ui/input'
import { useAvaliacoes } from '@/hooks/useAvaliacoes'
import { useAuth } from '@/hooks/useAuth'
import { composicaoCorporalSchema } from '@/schemas/composicaoCorporalSchema'
import type {
  FormularioComposicaoCorporalDados,
  FormularioComposicaoCorporalValores,
  ResultadoComposicaoCorporal,
} from '@/types/composicaoCorporal'
import type { Avaliacao } from '@/services/avaliacoes/avaliacoes.service'

interface BodyCompositionCalculatorProps {
  clienteId?: number | null
  clienteSexo?: 'masculino' | 'feminino'
  editingAvaliacao?: Avaliacao | null
  onAvaliacaoSaved?: () => void
}

const CAMPOS_DOBRAS_ORDEM: Array<
  Exclude<
    keyof FormularioComposicaoCorporalValores,
    | 'dataAvaliacao'
    | 'peso'
    | 'altura'
    | 'ombro'
    | 'torax'
    | 'cintura'
    | 'abdomen'
    | 'quadril'
    | 'coxaDireita'
    | 'coxaEsquerda'
    | 'panturrilhaDireita'
    | 'panturrilhaEsquerda'
    | 'bracoDireito'
    | 'bracoEsquerdo'
    | 'antebracoDireito'
    | 'antebracoEsquerdo'
    | 'punhoDireito'
    | 'punhoEsquerdo'
  >
> = ['triceps', 'subescapular', 'peitoral', 'axilarMedia', 'suprailiaca', 'abdominal', 'coxa']

const LABELS_MEDIDAS: Record<
  | 'ombro'
  | 'torax'
  | 'cintura'
  | 'abdomen'
  | 'quadril'
  | 'coxaDireita'
  | 'coxaEsquerda'
  | 'panturrilhaDireita'
  | 'panturrilhaEsquerda'
  | 'bracoDireito'
  | 'bracoEsquerdo'
  | 'antebracoDireito'
  | 'antebracoEsquerdo'
  | 'punhoDireito'
  | 'punhoEsquerdo',
  string
> = {
  ombro: 'Ombro',
  torax: 'Torax',
  cintura: 'Cintura',
  abdomen: 'Abdomen',
  quadril: 'Quadril',
  coxaDireita: 'Coxa D',
  coxaEsquerda: 'Coxa E',
  panturrilhaDireita: 'Panturrilha D',
  panturrilhaEsquerda: 'Panturrilha E',
  bracoDireito: 'Braço D',
  bracoEsquerdo: 'Braço E',
  antebracoDireito: 'Antebraco D',
  antebracoEsquerdo: 'Antebraco E',
  punhoDireito: 'Punho D',
  punhoEsquerdo: 'Punho E',
}

const PLACEHOLDER_MEDIDAS: Record<
  | 'ombro'
  | 'torax'
  | 'cintura'
  | 'abdomen'
  | 'quadril'
  | 'coxaDireita'
  | 'coxaEsquerda'
  | 'panturrilhaDireita'
  | 'panturrilhaEsquerda'
  | 'bracoDireito'
  | 'bracoEsquerdo'
  | 'antebracoDireito'
  | 'antebracoEsquerdo'
  | 'punhoDireito'
  | 'punhoEsquerdo',
  string
> = {
  ombro: 'cm',
  torax: 'cm',
  cintura: 'cm',
  abdomen: 'cm',
  quadril: 'cm',
  coxaDireita: 'cm',
  coxaEsquerda: 'cm',
  panturrilhaDireita: 'cm',
  panturrilhaEsquerda: 'cm',
  bracoDireito: 'cm',
  bracoEsquerdo: 'cm',
  antebracoDireito: 'cm',
  antebracoEsquerdo: 'cm',
  punhoDireito: 'cm',
  punhoEsquerdo: 'cm',
}

export function BodyCompositionCalculator({
  clienteId,
  clienteSexo,
  editingAvaliacao,
  onAvaliacaoSaved,
}: BodyCompositionCalculatorProps) {
  const [resultado, setResultado] = useState<ResultadoComposicaoCorporal | null>(null)
  const [isSavingAvaliacao, setIsSavingAvaliacao] = useState(false)
  const { profile } = useAuth()

  const { latestAvaliacao, createAvaliacao, updateAvaliacao } = useAvaliacoes({
    clienteId: clienteId ?? undefined,
  })

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<
    FormularioComposicaoCorporalValores,
    undefined,
    FormularioComposicaoCorporalDados
  >({
    resolver: zodResolver(composicaoCorporalSchema),
    mode: 'onBlur',
    defaultValues: {
      dataAvaliacao: new Date().toISOString().split('T')[0],
      peso: '',
      altura: '',
      triceps: '',
      axilarMedia: '',
      subescapular: '',
      peitoral: '',
      abdominal: '',
      suprailiaca: '',
      coxa: '',
      ombro: '',
      torax: '',
      cintura: '',
      abdomen: '',
      quadril: '',
      coxaDireita: '',
      coxaEsquerda: '',
      panturrilhaDireita: '',
      panturrilhaEsquerda: '',
      bracoDireito: '',
      bracoEsquerdo: '',
      antebracoDireito: '',
      antebracoEsquerdo: '',
      punhoDireito: '',
      punhoEsquerdo: '',
    },
  })

  function toOptionalString(value?: number) {
    return value == null ? '' : value.toString()
  }

  useEffect(() => {
    if (editingAvaliacao) {
      reset({
        dataAvaliacao: editingAvaliacao.dataAvaliacao || new Date().toISOString().split('T')[0],
        peso: editingAvaliacao.peso.toString(),
        altura: toOptionalString(editingAvaliacao.altura),
        triceps: editingAvaliacao.triceps.toString(),
        axilarMedia: editingAvaliacao.axilarMedia.toString(),
        subescapular: editingAvaliacao.subescapular.toString(),
        peitoral: editingAvaliacao.peitoral.toString(),
        abdominal: editingAvaliacao.abdominal.toString(),
        suprailiaca: editingAvaliacao.suprailiaca.toString(),
        coxa: editingAvaliacao.coxa.toString(),
        ombro: toOptionalString(editingAvaliacao.ombro),
        torax: toOptionalString(editingAvaliacao.torax),
        cintura: toOptionalString(editingAvaliacao.cintura),
        abdomen: toOptionalString(editingAvaliacao.abdomen),
        quadril: toOptionalString(editingAvaliacao.quadril),
        coxaDireita: toOptionalString(editingAvaliacao.coxaDireita),
        coxaEsquerda: toOptionalString(editingAvaliacao.coxaEsquerda),
        panturrilhaDireita: toOptionalString(editingAvaliacao.panturrilhaDireita),
        panturrilhaEsquerda: toOptionalString(editingAvaliacao.panturrilhaEsquerda),
        bracoDireito: toOptionalString(editingAvaliacao.bracoDireito),
        bracoEsquerdo: toOptionalString(editingAvaliacao.bracoEsquerdo),
        antebracoDireito: toOptionalString(editingAvaliacao.antebracoDireito),
        antebracoEsquerdo: toOptionalString(editingAvaliacao.antebracoEsquerdo),
        punhoDireito: toOptionalString(editingAvaliacao.punhoDireito),
        punhoEsquerdo: toOptionalString(editingAvaliacao.punhoEsquerdo),
      })
    }
  }, [editingAvaliacao, reset])

  useEffect(() => {
    if (editingAvaliacao) {
      setResultado({
        percentualGordura: editingAvaliacao.percentualGordura.toFixed(2),
        massaMagraKg: editingAvaliacao.massaMagraKg.toFixed(2),
        massaGordaKg: editingAvaliacao.massaGorduraKg.toFixed(2),
      })
    }
  }, [editingAvaliacao])

  async function onSubmit(values: FormularioComposicaoCorporalDados) {
    const sexoCalculadora: BodyCompositionSex = clienteSexo === 'feminino' ? 'feminino' : 'masculino'

    const calculo = calculateBodyComposition({
      peso: values.peso,
      altura: values.altura,
      triceps: values.triceps,
      axilarMedia: values.axilarMedia,
      subescapular: values.subescapular,
      peitoral: values.peitoral,
      abdominal: values.abdominal,
      suprailiaca: values.suprailiaca,
      coxa: values.coxa,
      sexo: sexoCalculadora,
    })

    const novoResultado = {
      percentualGordura: calculo.percentualGordura.toDecimalPlaces(2).toFixed(2),
      massaMagraKg: calculo.massaMagraKg.toDecimalPlaces(2).toFixed(2),
      massaGordaKg: calculo.massaGordaKg.toDecimalPlaces(2).toFixed(2),
    }
    const massaMagraNum = Number.parseFloat(novoResultado.massaMagraKg)
    const massaGorduraNum = Number.parseFloat(novoResultado.massaGordaKg)
    const percentualGorduraNum = Number.parseFloat(novoResultado.percentualGordura)

    if (!Number.isFinite(massaMagraNum) || massaMagraNum > 9999.99) {
      alert(`Erro: Massa magra calculada (${massaMagraNum}) é inválida. Verifique os dados inseridos (especialmente altura e peso).`)
      return
    }
    if (!Number.isFinite(massaGorduraNum) || massaGorduraNum > 9999.99) {
      alert(`Erro: Massa de gordura calculada (${massaGorduraNum}) é inválida. Verifique os dados inseridos.`)
      return
    }
    if (!Number.isFinite(percentualGorduraNum) || percentualGorduraNum > 999.99) {
      alert(`Erro: Percentual de gordura calculado (${percentualGorduraNum}%) é inválido. Verifique os dados inseridos.`)
      return
    }

    setResultado(novoResultado)
    if (clienteId && profile) {
      setIsSavingAvaliacao(true)
      try {
        const avaliacaoData = {
          clienteId,
          tenantId: profile.tenant_id,
          criadoPor: profile.id,
          peso: values.peso,
          triceps: values.triceps,
          axilarMedia: values.axilarMedia,
          subescapular: values.subescapular,
          peitoral: values.peitoral,
          abdominal: values.abdominal,
          suprailiaca: values.suprailiaca,
          coxa: values.coxa,
          altura: values.altura,
          sexo: (clienteSexo || 'masculino') as 'masculino' | 'feminino',
          percentualGordura: Number.parseFloat(novoResultado.percentualGordura),
          massaMagraKg: Number.parseFloat(novoResultado.massaMagraKg),
          massaGorduraKg: Number.parseFloat(novoResultado.massaGordaKg),
          dataAvaliacao: values.dataAvaliacao,
          ombro: values.ombro,
          torax: values.torax,
          cintura: values.cintura,
          abdomen: values.abdomen,
          quadril: values.quadril,
          coxaDireita: values.coxaDireita,
          coxaEsquerda: values.coxaEsquerda,
          panturrilhaDireita: values.panturrilhaDireita,
          panturrilhaEsquerda: values.panturrilhaEsquerda,
          bracoDireito: values.bracoDireito,
          bracoEsquerdo: values.bracoEsquerdo,
          antebracoDireito: values.antebracoDireito,
          antebracoEsquerdo: values.antebracoEsquerdo,
          punhoDireito: values.punhoDireito,
          punhoEsquerdo: values.punhoEsquerdo,
        }
        if (!Number.isFinite(avaliacaoData.peso) || avaliacaoData.peso > 9999.99) {
          throw new Error('Peso inválido para salvar')
        }
        if (!Number.isFinite(avaliacaoData.percentualGordura) || avaliacaoData.percentualGordura > 999.99) {
          throw new Error('Percentual de gordura inválido para salvar')
        }
        if (!Number.isFinite(avaliacaoData.massaMagraKg) || avaliacaoData.massaMagraKg > 9999.99) {
          throw new Error('Massa magra inválida para salvar')
        }
        if (!Number.isFinite(avaliacaoData.massaGorduraKg) || avaliacaoData.massaGorduraKg > 9999.99) {
          throw new Error('Massa de gordura inválida para salvar')
        }

        if (editingAvaliacao) {
          await updateAvaliacao({
            id: editingAvaliacao.id,
            data: avaliacaoData,
          })
        } else {
          await createAvaliacao(avaliacaoData)
        }
        onAvaliacaoSaved?.()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar avaliação. Tente novamente.'
        alert(errorMessage)
      } finally {
        setIsSavingAvaliacao(false)
      }
    }
  }

  function handleClear() {
    reset()
    setResultado(null)
  }
  if (!clienteId) {
    return (
      <section className="mt-6 border-t border-[rgba(169,255,46,0.26)] pt-5">
        <h2 className="m-0 mb-4 font-bebas font-medium tracking-tight text-[#d8ffe8]">
          Avaliação de Composição Corporal
        </h2>
        <p className="text-gray-400 text-sm">
          Selecione um cliente na lista acima para registrar uma avaliação.
        </p>
      </section>
    )
  }

  return (
    <>
      <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <InputField<
          FormularioComposicaoCorporalValores,
          undefined,
          FormularioComposicaoCorporalDados
        >
          control={control}
          name="dataAvaliacao"
          type="date"
          label="Data da Avaliação"
          containerClassName="col-span-1 md:col-span-2"
        />

        {(['peso', 'altura'] as const).map((campo) => {
          const definicaoCampo = clientSchema[campo]

          return (
            <NumberInputField<
              FormularioComposicaoCorporalValores,
              undefined,
              FormularioComposicaoCorporalDados
            >
              key={campo}
              control={control}
              name={campo}
              label={definicaoCampo.label}
              placeholder={definicaoCampo.placeholder}
            />
          )
        })}

        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#d8ffe8]">Medidas (opcional)</h3>
            <div className="grid grid-cols-1 gap-3">
              {/* Campos simples */}
              {(['ombro', 'torax', 'cintura', 'abdomen', 'quadril'] as const).map((campo) => (
                <NumberInputField<
                  FormularioComposicaoCorporalValores,
                  undefined,
                  FormularioComposicaoCorporalDados
                >
                  key={campo}
                  control={control}
                  name={campo}
                  label={LABELS_MEDIDAS[campo]}
                  placeholder={PLACEHOLDER_MEDIDAS[campo]}
                />
              ))}
              
              {/* Campos pares (lado-a-lado) */}
              <div className="space-y-2 pt-2">
                {/* Coxa */}
                <div className="grid grid-cols-2 gap-1">
                  <NumberInputField<
                    FormularioComposicaoCorporalValores,
                    undefined,
                    FormularioComposicaoCorporalDados
                  >
                    control={control}
                    name="coxaDireita"
                    label={LABELS_MEDIDAS.coxaDireita}
                    placeholder={PLACEHOLDER_MEDIDAS.coxaDireita}
                  />
                  <NumberInputField<
                    FormularioComposicaoCorporalValores,
                    undefined,
                    FormularioComposicaoCorporalDados
                  >
                    control={control}
                    name="coxaEsquerda"
                    label={LABELS_MEDIDAS.coxaEsquerda}
                    placeholder={PLACEHOLDER_MEDIDAS.coxaEsquerda}
                  />
                </div>

                {/* Panturrilha */}
                <div className="grid grid-cols-2 gap-1">
                  <NumberInputField<
                    FormularioComposicaoCorporalValores,
                    undefined,
                    FormularioComposicaoCorporalDados
                  >
                    control={control}
                    name="panturrilhaDireita"
                    label={LABELS_MEDIDAS.panturrilhaDireita}
                    placeholder={PLACEHOLDER_MEDIDAS.panturrilhaDireita}
                  />
                  <NumberInputField<
                    FormularioComposicaoCorporalValores,
                    undefined,
                    FormularioComposicaoCorporalDados
                  >
                    control={control}
                    name="panturrilhaEsquerda"
                    label={LABELS_MEDIDAS.panturrilhaEsquerda}
                    placeholder={PLACEHOLDER_MEDIDAS.panturrilhaEsquerda}
                  />
                </div>

                {/* Braço */}
                <div className="grid grid-cols-2 gap-1">
                  <NumberInputField<
                    FormularioComposicaoCorporalValores,
                    undefined,
                    FormularioComposicaoCorporalDados
                  >
                    control={control}
                    name="bracoDireito"
                    label={LABELS_MEDIDAS.bracoDireito}
                    placeholder={PLACEHOLDER_MEDIDAS.bracoDireito}
                  />
                  <NumberInputField<
                    FormularioComposicaoCorporalValores,
                    undefined,
                    FormularioComposicaoCorporalDados
                  >
                    control={control}
                    name="bracoEsquerdo"
                    label={LABELS_MEDIDAS.bracoEsquerdo}
                    placeholder={PLACEHOLDER_MEDIDAS.bracoEsquerdo}
                  />
                </div>

                {/* Antebraço */}
                <div className="grid grid-cols-2 gap-1">
                  <NumberInputField<
                    FormularioComposicaoCorporalValores,
                    undefined,
                    FormularioComposicaoCorporalDados
                  >
                    control={control}
                    name="antebracoDireito"
                    label={LABELS_MEDIDAS.antebracoDireito}
                    placeholder={PLACEHOLDER_MEDIDAS.antebracoDireito}
                  />
                  <NumberInputField<
                    FormularioComposicaoCorporalValores,
                    undefined,
                    FormularioComposicaoCorporalDados
                  >
                    control={control}
                    name="antebracoEsquerdo"
                    label={LABELS_MEDIDAS.antebracoEsquerdo}
                    placeholder={PLACEHOLDER_MEDIDAS.antebracoEsquerdo}
                  />
                </div>

                {/* Punho */}
                <div className="grid grid-cols-2 gap-1">
                  <NumberInputField<
                    FormularioComposicaoCorporalValores,
                    undefined,
                    FormularioComposicaoCorporalDados
                  >
                    control={control}
                    name="punhoDireito"
                    label={LABELS_MEDIDAS.punhoDireito}
                    placeholder={PLACEHOLDER_MEDIDAS.punhoDireito}
                  />
                  <NumberInputField<
                    FormularioComposicaoCorporalValores,
                    undefined,
                    FormularioComposicaoCorporalDados
                  >
                    control={control}
                    name="punhoEsquerdo"
                    label={LABELS_MEDIDAS.punhoEsquerdo}
                    placeholder={PLACEHOLDER_MEDIDAS.punhoEsquerdo}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#d8ffe8]">Dobras cutâneas</h3>
            <div className="grid grid-cols-1 gap-3">
              {CAMPOS_DOBRAS_ORDEM.map((campo) => {
                const definicaoCampo = clientSchema[campo]

                return (
                  <NumberInputField<
                    FormularioComposicaoCorporalValores,
                    undefined,
                    FormularioComposicaoCorporalDados
                  >
                    key={campo}
                    control={control}
                    name={campo}
                    label={definicaoCampo.label}
                    placeholder={definicaoCampo.placeholder}
                  />
                )
              })}
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-2 md:gap-3 mt-2">
          <Button
            type="submit"
            disabled={isSubmitting || isSavingAvaliacao}
            isLoading={isSavingAvaliacao}
            loadingText="Salvando..."
            showLoadingText
            className='h-10'
          >
            Calcular e Salvar
          </Button>
          <Button type="button" variant="outline" onClick={handleClear} className='h-10'>
            Limpar
          </Button>
        </div>
      </form>

      {resultado ? (
        <section className="mt-6 border-t border-[rgba(169,255,46,0.26)] pt-5" aria-live="polite">
          <h2 className="m-0 mb-4 font-bebas font-medium tracking-tight text-[#d8ffe8]">
            Resultados da Avaliação
          </h2>

          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center justify-between rounded-2xl p-3 bg-[rgba(9,16,12,0.86)] text-[#d4f8e2]">
              <strong className="text-sm">Percentual de Gordura Corporal</strong>
              <span className="text-xl font-extrabold">{resultado.percentualGordura}%</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl p-3 bg-[rgba(169,255,46,0.2)] text-[#dbff8b]">
              <strong className="text-sm">Massa Magra</strong>
              <span className="text-xl font-extrabold">{resultado.massaMagraKg} kg</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl p-3 bg-[rgba(78,14,14,0.62)] text-[#ff7b7b]">
              <strong className="text-sm">Massa de Gordura</strong>
              <span className="text-xl font-extrabold">{resultado.massaGordaKg} kg</span>
            </div>
          </div>

          {latestAvaliacao?.dataAvaliacao &&
            latestAvaliacao.dataAvaliacao !== new Date().toISOString().split('T')[0] ? (
            <div className="border-t border-[rgba(169,255,46,0.26)] pt-4">
              <h3 className="m-0 mb-3 font-bebas font-medium tracking-tight text-[#d8ffe8]">
                Comparação com Última Avaliação
              </h3>
              <div className="flex flex-col gap-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Gordura:</span>
                  <span
                    className={
                      parseFloat(resultado.percentualGordura) < latestAvaliacao.percentualGordura
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {(Number.parseFloat(resultado.percentualGordura) - latestAvaliacao.percentualGordura).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Massa Magra:</span>
                  <span
                    className={
                      parseFloat(resultado.massaMagraKg) > latestAvaliacao.massaMagraKg
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {(Number.parseFloat(resultado.massaMagraKg) - latestAvaliacao.massaMagraKg).toFixed(2)} kg
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  )
}
