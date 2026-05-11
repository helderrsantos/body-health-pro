import { supabase } from '@/lib/supabase'
import type { ClientRegistrationFormValues, ClientRow, ClientsListResult } from '@/types/client'
import { CLIENTS_ROUTES } from '@/services/clients/clients.routes'

interface ListClientsParams {
  page: number
  query: string
  pageSize: number
}

function normalizeClientName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, ' ')
}

async function assertClientNameNotDuplicated(nome: string) {
  const normalizedInput = normalizeClientName(nome)

  const { data, error } = await supabase
    .from(CLIENTS_ROUTES.table)
    .select('id,nome')
    .ilike('nome', nome.trim())

  if (error) {
    throw new Error(error.message)
  }

  const duplicated = (data ?? []).some((item) => normalizeClientName(item.nome) === normalizedInput)

  if (duplicated) {
    throw new Error('Ja existe um cliente com este nome.')
  }
}

export async function listClients({ page, query, pageSize }: Readonly<ListClientsParams>) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let request = supabase
    .from(CLIENTS_ROUTES.table)
    .select(CLIENTS_ROUTES.listSelect, { count: 'exact' })
    .order('nome_normalizado', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to)

  const normalizedQuery = query.trim()
  if (normalizedQuery) {
    request = request.ilike('nome', `%${normalizedQuery}%`)
  }

  const { data, error, count } = await request

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      throw new Error("Tabela 'clientes' não encontrada no Supabase.")
    }

    throw new Error(error.message)
  }

  const result: ClientsListResult = {
    rows: (data ?? []) as ClientRow[],
    count: count ?? 0,
  }

  return result
}

export async function createClient(values: Readonly<ClientRegistrationFormValues>) {
  await assertClientNameNotDuplicated(values.nome)

  const { error } = await supabase.from(CLIENTS_ROUTES.table).insert({
    nome: values.nome,
    data_nascimento: values.dataNascimento,
    sexo: values.sexo,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteClientById(clientId: number) {
  const { data, error } = await supabase
    .from(CLIENTS_ROUTES.table)
    .delete()
    .eq('id', clientId)
    .select(CLIENTS_ROUTES.deleteSelect)

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    throw new Error('Não foi possível deletar. Verifique permissões RLS para delete.')
  }

  return clientId
}
