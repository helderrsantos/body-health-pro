import { supabase } from '@/lib/supabase'

function throwAvaliacaoError(context: string, error: { code?: string; message: string }): never {
  if (error.code === 'PGRST205' || error.code === '42P01') {
    throw new Error(
      "Tabela 'public.avaliacoes' nao encontrada. Execute o SQL em packages/database/sql/phase2_avaliacoes.sql no Supabase SQL Editor.",
    )
  }

  if (error.code === 'PGRST204') {
    throw new Error(
      'Estrutura da tabela avaliacoes divergente do app (coluna ausente no banco). Verifique as migracoes aplicadas no Supabase.',
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
  peso: number
  sexo: 'masculino' | 'feminino'
  percentualGordura: number
  massaMagraKg: number
  massaGorduraKg: number
  dataAvaliacao?: string // ISO date, defaults to today
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
        peso: data.peso,
        sexo: data.sexo,
        percentual_gordura: data.percentualGordura,
        massa_magra_kg: data.massaMagraKg,
        massa_gordura_kg: data.massaGorduraKg,
        data_avaliacao: data.dataAvaliacao || new Date().toISOString().split('T')[0],
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
    peso: result.peso,
    sexo: result.sexo,
    percentualGordura: result.percentual_gordura,
    massaMagraKg: result.massa_magra_kg,
    massaGorduraKg: result.massa_gordura_kg,
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
      peso: data.peso,
      sexo: data.sexo,
      percentual_gordura: data.percentualGordura,
      massa_magra_kg: data.massaMagraKg,
      massa_gordura_kg: data.massaGorduraKg,
      data_avaliacao: data.dataAvaliacao || new Date().toISOString().split('T')[0],
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
    peso: result.peso,
    sexo: result.sexo,
    percentualGordura: result.percentual_gordura,
    massaMagraKg: result.massa_magra_kg,
    massaGorduraKg: result.massa_gordura_kg,
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
    peso: row.peso,
    sexo: row.sexo,
    percentualGordura: row.percentual_gordura,
    massaMagraKg: row.massa_magra_kg,
    massaGorduraKg: row.massa_gordura_kg,
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
    peso: data.peso,
    sexo: data.sexo,
    percentualGordura: data.percentual_gordura,
    massaMagraKg: data.massa_magra_kg,
    massaGorduraKg: data.massa_gordura_kg,
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
