import { validation } from './validation'

export type BodyCompositionSex = 'masculino' | 'feminino'

export type ClientFieldKey =
  | 'peitoral'
  | 'abdominal'
  | 'coxa'
  | 'axilarMedia'
  | 'subescapular'
  | 'suprailiaca'
  | 'triceps'
  | 'altura'
  | 'peso'
  | 'sexo'

export type FieldType = 'decimal' | 'integer' | 'select'

export type ClientFieldDefinition = {
  label: string
  type: FieldType
  step?: string
  placeholder: string
  options?: Array<{ value: BodyCompositionSex; label: string }>
  validate: (value: string) => string | null
}

export const clientSchema: Record<ClientFieldKey, ClientFieldDefinition> = {
  peitoral: {
    label: 'Peitoral (mm)',
    type: 'decimal',
    step: '0.1',
    placeholder: 'Ex.: 12.5',
    validate: (value) => validation.positiveDecimal(value, 'Peitoral'),
  },
  abdominal: {
    label: 'Abdominal (mm)',
    type: 'decimal',
    step: '0.1',
    placeholder: 'Ex.: 18.2',
    validate: (value) => validation.positiveDecimal(value, 'Abdominal'),
  },
  coxa: {
    label: 'Coxa (mm)',
    type: 'decimal',
    step: '0.1',
    placeholder: 'Ex.: 16.4',
    validate: (value) => validation.positiveDecimal(value, 'Coxa'),
  },
  axilarMedia: {
    label: 'Axilar Media (mm)',
    type: 'decimal',
    step: '0.1',
    placeholder: 'Ex.: 11.0',
    validate: (value) => validation.positiveDecimal(value, 'Axilar Media'),
  },
  subescapular: {
    label: 'Subescapular (mm)',
    type: 'decimal',
    step: '0.1',
    placeholder: 'Ex.: 14.7',
    validate: (value) => validation.positiveDecimal(value, 'Subescapular'),
  },
  suprailiaca: {
    label: 'Suprailiaca (mm)',
    type: 'decimal',
    step: '0.1',
    placeholder: 'Ex.: 13.6',
    validate: (value) => validation.positiveDecimal(value, 'Suprailiaca'),
  },
  triceps: {
    label: 'Triceps (mm)',
    type: 'decimal',
    step: '0.1',
    placeholder: 'Ex.: 10.8',
    validate: (value) => validation.positiveDecimal(value, 'Triceps'),
  },
  altura: {
    label: 'Altura (cm)',
    type: 'decimal',
    step: '0.1',
    placeholder: 'Ex.: 175.0',
    validate: (value) => validation.positiveDecimal(value, 'Altura'),
  },
  peso: {
    label: 'Peso corporal (kg)',
    type: 'decimal',
    step: '0.1',
    placeholder: 'Ex.: 72.4',
    validate: (value) => validation.positiveDecimal(value, 'Peso corporal'),
  },
  sexo: {
    label: 'Sexo biologico',
    type: 'select',
    placeholder: 'Selecione',
    options: [
      { value: 'masculino', label: 'Masculino' },
      { value: 'feminino', label: 'Feminino' },
    ],
    validate: (value) => validation.selectRequired(value, 'Sexo biologico'),
  },
}
