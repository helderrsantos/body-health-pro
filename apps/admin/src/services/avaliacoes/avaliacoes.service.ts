import { supabase } from '@/lib/supabase'

function throwAvaliacaoError(context: string, error: { code?: string; message: string }): never {
  if (error.code === 'PGRST205' || error.code === '42P01') {
    throw new Error(
      "Tabela 'public.avaliacoes' nao encontrada. Execute o SQL em packages/database/sql/phase2_avaliacoes.sql no Supabase SQL Editor.",
    )
  }

  if (error.code === 'PGRST204') {
    throw new Error(
      "Estrutura da tabela avaliacoes divergente do app (coluna ausente no banco). Verifique as migracoes aplicadas no Supabase, incluindo packages/database/sql/phase3_avaliacoes_medidas.sql.",
    )
  }

  if (error.code === '22003') {
    throw new Error(
      'Um dos valores inseridos é muito grande para o campo (overflow numérico). Verifique especialmente: dobras cutâneas (máx 500mm), peso (máx 9999.99kg), percentual gordura (máx 999.99%). Se os valores parecerem corretos, a altura ou peso podem estar em unidade incorreta.',
    )
  }

  throw new Error(`${context}: ${error.message}`)
}

export interface AvaliacaoData {
  clienteId: number
  tenantId: string
  criadoPor: string
  peitoral: number
  abdominal: number
  coxa: number
  axilarMedia: number
  subescapular: number
  suprailiaca: number
  triceps: number
  altura?: number
  peso: number
  sexo: 'masculino' | 'feminino'
  percentualGordura: number
  massaMagraKg: number
  massaGorduraKg: number
  dataAvaliacao?: string // ISO date, defaults to today
  ombro?: number
  torax?: number
  cintura?: number
  quadril?: number
  coxaDireita?: number
  coxaEsquerda?: number
  panturrilhaDireita?: number
  panturrilhaEsquerda?: number
  bracoDireito?: number
  bracoEsquerdo?: number
  antebracoDireito?: number
  antebracoEsquerdo?: number
  punhoDireito?: number
  punhoEsquerdo?: number
}

export interface Avaliacao extends AvaliacaoData {
  id: number
  tenantId: string
  criadoPor: string
  createdAt: string
  updatedAt: string
}

/**
 * Save a new avaliacao (assessment) for a client
 */
export async function createAvaliacao(data: AvaliacaoData): Promise<Avaliacao> {
  const { data: result, error } = await supabase
    .from('avaliacoes')
    .insert([
      {
        tenant_id: data.tenantId,
        cliente_id: data.clienteId,
        criado_por: data.criadoPor,
        peitoral: data.peitoral,
        abdominal: data.abdominal,
        coxa: data.coxa,
        axilar_media: data.axilarMedia,
        subescapular: data.subescapular,
        suprailiaca: data.suprailiaca,
        triceps: data.triceps,
        altura: data.altura ?? null,
        peso: data.peso,
        sexo: data.sexo,
        percentual_gordura: data.percentualGordura,
        massa_magra_kg: data.massaMagraKg,
        massa_gordura_kg: data.massaGorduraKg,
        data_avaliacao: data.dataAvaliacao || new Date().toISOString().split('T')[0],
        ombro: data.ombro ?? null,
        torax: data.torax ?? null,
        cintura: data.cintura ?? null,
        quadril: data.quadril ?? null,
        coxa_direita: data.coxaDireita ?? null,
        coxa_esquerda: data.coxaEsquerda ?? null,
        panturrilha_direita: data.panturrilhaDireita ?? null,
        panturrilha_esquerda: data.panturrilhaEsquerda ?? null,
        braco_direito: data.bracoDireito ?? null,
        braco_esquerdo: data.bracoEsquerdo ?? null,
        antebraco_direito: data.antebracoDireito ?? null,
        antebraco_esquerdo: data.antebracoEsquerdo ?? null,
        punho_direito: data.punhoDireito ?? null,
        punho_esquerdo: data.punhoEsquerdo ?? null,
      },
    ])
    .select()
    .single()

  if (error) {
    throwAvaliacaoError('Erro ao salvar avaliação', error)
  }

  return {
    id: result.id,
    tenantId: result.tenant_id,
    clienteId: result.cliente_id,
    peitoral: result.peitoral,
    abdominal: result.abdominal,
    coxa: result.coxa,
    axilarMedia: result.axilar_media,
    subescapular: result.subescapular,
    suprailiaca: result.suprailiaca,
    triceps: result.triceps,
    altura: result.altura ?? undefined,
    peso: result.peso,
    sexo: result.sexo,
    percentualGordura: result.percentual_gordura,
    massaMagraKg: result.massa_magra_kg,
    massaGorduraKg: result.massa_gordura_kg,
    ombro: result.ombro ?? undefined,
    torax: result.torax ?? undefined,
    cintura: result.cintura ?? undefined,
    quadril: result.quadril ?? undefined,
    coxaDireita: result.coxa_direita ?? undefined,
    coxaEsquerda: result.coxa_esquerda ?? undefined,
    panturrilhaDireita: result.panturrilha_direita ?? undefined,
    panturrilhaEsquerda: result.panturrilha_esquerda ?? undefined,
    bracoDireito: result.braco_direito ?? undefined,
    bracoEsquerdo: result.braco_esquerdo ?? undefined,
    antebracoDireito: result.antebraco_direito ?? undefined,
    antebracoEsquerdo: result.antebraco_esquerdo ?? undefined,
    punhoDireito: result.punho_direito ?? undefined,
    punhoEsquerdo: result.punho_esquerdo ?? undefined,
    criadoPor: result.criado_por,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
    dataAvaliacao: result.data_avaliacao,
  }
}

/**
 * Update an existing avaliacao
 */
export async function updateAvaliacao(
  avaliacaoId: number,
  data: Omit<AvaliacaoData, 'clienteId'>,
): Promise<Avaliacao> {
  const { data: result, error } = await supabase
    .from('avaliacoes')
    .update({
      peitoral: data.peitoral,
      abdominal: data.abdominal,
      coxa: data.coxa,
      axilar_media: data.axilarMedia,
      subescapular: data.subescapular,
      suprailiaca: data.suprailiaca,
      triceps: data.triceps,
      altura: data.altura ?? null,
      peso: data.peso,
      sexo: data.sexo,
      percentual_gordura: data.percentualGordura,
      massa_magra_kg: data.massaMagraKg,
      massa_gordura_kg: data.massaGorduraKg,
      data_avaliacao: data.dataAvaliacao || new Date().toISOString().split('T')[0],
      ombro: data.ombro ?? null,
      torax: data.torax ?? null,
      cintura: data.cintura ?? null,
      quadril: data.quadril ?? null,
      coxa_direita: data.coxaDireita ?? null,
      coxa_esquerda: data.coxaEsquerda ?? null,
      panturrilha_direita: data.panturrilhaDireita ?? null,
      panturrilha_esquerda: data.panturrilhaEsquerda ?? null,
      braco_direito: data.bracoDireito ?? null,
      braco_esquerdo: data.bracoEsquerdo ?? null,
      antebraco_direito: data.antebracoDireito ?? null,
      antebraco_esquerdo: data.antebracoEsquerdo ?? null,
      punho_direito: data.punhoDireito ?? null,
      punho_esquerdo: data.punhoEsquerdo ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', avaliacaoId)
    .select()
    .single()

  if (error) {
    throwAvaliacaoError('Erro ao atualizar avaliação', error)
  }

  return {
    id: result.id,
    tenantId: result.tenant_id,
    clienteId: result.cliente_id,
    peitoral: result.peitoral,
    abdominal: result.abdominal,
    coxa: result.coxa,
    axilarMedia: result.axilar_media,
    subescapular: result.subescapular,
    suprailiaca: result.suprailiaca,
    triceps: result.triceps,
    altura: result.altura ?? undefined,
    peso: result.peso,
    sexo: result.sexo,
    percentualGordura: result.percentual_gordura,
    massaMagraKg: result.massa_magra_kg,
    massaGorduraKg: result.massa_gordura_kg,
    ombro: result.ombro ?? undefined,
    torax: result.torax ?? undefined,
    cintura: result.cintura ?? undefined,
    quadril: result.quadril ?? undefined,
    coxaDireita: result.coxa_direita ?? undefined,
    coxaEsquerda: result.coxa_esquerda ?? undefined,
    panturrilhaDireita: result.panturrilha_direita ?? undefined,
    panturrilhaEsquerda: result.panturrilha_esquerda ?? undefined,
    bracoDireito: result.braco_direito ?? undefined,
    bracoEsquerdo: result.braco_esquerdo ?? undefined,
    antebracoDireito: result.antebraco_direito ?? undefined,
    antebracoEsquerdo: result.antebraco_esquerdo ?? undefined,
    punhoDireito: result.punho_direito ?? undefined,
    punhoEsquerdo: result.punho_esquerdo ?? undefined,
    criadoPor: result.criado_por,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
    dataAvaliacao: result.data_avaliacao,
  }
}

/**
 * Get all avaliacoes for a client
 */
export async function getAvaliacoesByCliente(clienteId: number): Promise<Avaliacao[]> {
  const { data, error } = await supabase
    .from('avaliacoes')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('data_avaliacao', { ascending: false })

  if (error) {
    throwAvaliacaoError('Erro ao buscar avaliações', error)
  }

  return data.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    clienteId: row.cliente_id,
    peitoral: row.peitoral,
    abdominal: row.abdominal,
    coxa: row.coxa,
    axilarMedia: row.axilar_media,
    subescapular: row.subescapular,
    suprailiaca: row.suprailiaca,
    triceps: row.triceps,
    altura: row.altura ?? undefined,
    peso: row.peso,
    sexo: row.sexo,
    percentualGordura: row.percentual_gordura,
    massaMagraKg: row.massa_magra_kg,
    massaGorduraKg: row.massa_gordura_kg,
    ombro: row.ombro ?? undefined,
    torax: row.torax ?? undefined,
    cintura: row.cintura ?? undefined,
    quadril: row.quadril ?? undefined,
    coxaDireita: row.coxa_direita ?? undefined,
    coxaEsquerda: row.coxa_esquerda ?? undefined,
    panturrilhaDireita: row.panturrilha_direita ?? undefined,
    panturrilhaEsquerda: row.panturrilha_esquerda ?? undefined,
    bracoDireito: row.braco_direito ?? undefined,
    bracoEsquerdo: row.braco_esquerdo ?? undefined,
    antebracoDireito: row.antebraco_direito ?? undefined,
    antebracoEsquerdo: row.antebraco_esquerdo ?? undefined,
    punhoDireito: row.punho_direito ?? undefined,
    punhoEsquerdo: row.punho_esquerdo ?? undefined,
    criadoPor: row.criado_por,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dataAvaliacao: row.data_avaliacao,
  }))
}

/**
 * Get latest avaliacao for a client
 */
export async function getLatestAvaliacaoByCliente(clienteId: number): Promise<Avaliacao | null> {
  const { data, error } = await supabase
    .from('avaliacoes')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('data_avaliacao', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is OK
    throwAvaliacaoError('Erro ao buscar última avaliação', error)
  }

  if (!data) return null

  return {
    id: data.id,
    tenantId: data.tenant_id,
    clienteId: data.cliente_id,
    peitoral: data.peitoral,
    abdominal: data.abdominal,
    coxa: data.coxa,
    axilarMedia: data.axilar_media,
    subescapular: data.subescapular,
    suprailiaca: data.suprailiaca,
    triceps: data.triceps,
    altura: data.altura ?? undefined,
    peso: data.peso,
    sexo: data.sexo,
    percentualGordura: data.percentual_gordura,
    massaMagraKg: data.massa_magra_kg,
    massaGorduraKg: data.massa_gordura_kg,
    ombro: data.ombro ?? undefined,
    torax: data.torax ?? undefined,
    cintura: data.cintura ?? undefined,
    quadril: data.quadril ?? undefined,
    coxaDireita: data.coxa_direita ?? undefined,
    coxaEsquerda: data.coxa_esquerda ?? undefined,
    panturrilhaDireita: data.panturrilha_direita ?? undefined,
    panturrilhaEsquerda: data.panturrilha_esquerda ?? undefined,
    bracoDireito: data.braco_direito ?? undefined,
    bracoEsquerdo: data.braco_esquerdo ?? undefined,
    antebracoDireito: data.antebraco_direito ?? undefined,
    antebracoEsquerdo: data.antebraco_esquerdo ?? undefined,
    punhoDireito: data.punho_direito ?? undefined,
    punhoEsquerdo: data.punho_esquerdo ?? undefined,
    criadoPor: data.criado_por,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    dataAvaliacao: data.data_avaliacao,
  }
}

/**
 * Delete an avaliacao
 */
export async function deleteAvaliacao(avaliacaoId: number): Promise<void> {
  const { error } = await supabase.from('avaliacoes').delete().eq('id', avaliacaoId)

  if (error) {
    throwAvaliacaoError('Erro ao deletar avaliação', error)
  }
}
