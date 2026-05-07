export type UUID = string
export type PapelUsuario = 'admin' | 'aluno'
export type PlanoUsuario = 'free' | 'pro'

export interface Usuario {
  id: UUID
  name: string
  email: string
  avatar: string | null
  role: PapelUsuario
  plan: PlanoUsuario
  stripe_customer_id: string | null
  created_at: string
}

export interface Aluno {
  id: UUID
  owner_id: UUID
  name: string
  birth_date: string
  gender: string
  student_code: string
  created_at: string
}

export interface Avaliacao {
  id: UUID
  student_id: UUID
  assessment_date: string
  weight: number
  height: number
  created_at: string
}

export interface DobrasCutaneas {
  assessment_id: UUID
  triceps: number
  subescapular: number
  peitoral: number
  axilar_media: number
  abdomen: number
  supra_iliaca: number
  coxa: number
}

export interface Perimetrias {
  assessment_id: UUID
  ombro: number
  torax: number
  cintura: number
  abdomen: number
  quadril: number
  coxa_d: number
  coxa_e: number
  panturrilha_d: number
  panturrilha_e: number
  biceps_d: number
  biceps_e: number
  biceps_contraido_d: number
  biceps_contraido_e: number
  antebraco_d: number
  antebraco_e: number
  punho_d: number
  punho_e: number
}
