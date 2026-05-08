import { z } from 'zod'

function decimalPositivo(campo: string) {
  return z
    .string()
    .transform((valor) => valor.trim().replace(',', '.'))
    .refine((valor) => valor.length > 0, `${campo} e obrigatorio.`)
    .refine((valor) => /^\d+(\.\d+)?$/.test(valor), `${campo} deve ser um numero valido.`)
    .transform(Number)
    .refine((valor) => Number.isFinite(valor) && valor > 0, `${campo} deve ser maior que zero.`)
}

function decimalOpcional(campo: string, maximo = 500) {
  return z
    .string()
    .transform((valor) => valor.trim().replace(',', '.'))
    .refine((valor) => valor.length === 0 || /^\d+(\.\d+)?$/.test(valor), `${campo} deve ser um numero valido.`)
    .transform((valor) => (valor.length === 0 ? undefined : Number(valor)))
    .refine(
      (valor) => valor === undefined || (Number.isFinite(valor) && valor > 0),
      `${campo} deve ser maior que zero.`,
    )
    .refine((valor) => valor === undefined || valor <= maximo, `${campo} não pode ser maior que ${maximo}.`)
}

export const composicaoCorporalSchema = z.object({
  dataAvaliacao: z
    .string()
    .refine((valor) => valor.trim().length > 0, 'Data da avaliacao e obrigatoria.'),
  peitoral: decimalPositivo('Peitoral')
    .refine((valor) => valor <= 500, 'Peitoral não pode ser maior que 500 mm'),
  abdominal: decimalPositivo('Abdominal')
    .refine((valor) => valor <= 500, 'Abdominal não pode ser maior que 500 mm'),
  coxa: decimalPositivo('Coxa')
    .refine((valor) => valor <= 500, 'Coxa não pode ser maior que 500 mm'),
  axilarMedia: decimalPositivo('Axilar media')
    .refine((valor) => valor <= 500, 'Axilar média não pode ser maior que 500 mm'),
  subescapular: decimalPositivo('Subescapular')
    .refine((valor) => valor <= 500, 'Subescapular não pode ser maior que 500 mm'),
  suprailiaca: decimalPositivo('Suprailiaca')
    .refine((valor) => valor <= 500, 'Suprailíaca não pode ser maior que 500 mm'),
  triceps: decimalPositivo('Triceps')
    .refine((valor) => valor <= 500, 'Tríceps não pode ser maior que 500 mm'),
  ombro: decimalOpcional('Ombro', 500),
  torax: decimalOpcional('Torax', 500),
  cintura: decimalOpcional('Cintura', 500),
  abdomen: decimalOpcional('Abdomen', 500),
  quadril: decimalOpcional('Quadril', 500),
  coxaDireita: decimalOpcional('Coxa direita', 500),
  coxaEsquerda: decimalOpcional('Coxa esquerda', 500),
  panturrilhaDireita: decimalOpcional('Panturrilha direita', 500),
  panturrilhaEsquerda: decimalOpcional('Panturrilha esquerda', 500),
  bracoDireito: decimalOpcional('Braço direito', 500),
  bracoEsquerdo: decimalOpcional('Braço esquerdo', 500),
  antebracoDireito: decimalOpcional('Antebraco direito', 500),
  antebracoEsquerdo: decimalOpcional('Antebraco esquerdo', 500),
  punhoDireito: decimalOpcional('Punho direito', 500),
  punhoEsquerdo: decimalOpcional('Punho esquerdo', 500),
  altura: decimalPositivo('Altura')
    .refine((valor) => valor >= 50 && valor <= 250, 'Altura deve estar entre 50 cm e 250 cm'),
  peso: decimalPositivo('Peso corporal')
    .refine((valor) => valor >= 20 && valor <= 500, 'Peso deve estar entre 20 kg e 500 kg'),
})
