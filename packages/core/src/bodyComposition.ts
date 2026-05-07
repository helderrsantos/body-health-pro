import Decimal from 'decimal.js'
import { toPositiveDecimal } from './decimal'
import type { BodyCompositionSex } from './clientSchema'

export type BodyCompositionInput = {
  peitoral: Decimal.Value
  abdominal: Decimal.Value
  coxa: Decimal.Value
  axilarMedia: Decimal.Value
  subescapular: Decimal.Value
  suprailiaca: Decimal.Value
  triceps: Decimal.Value
  altura: Decimal.Value
  peso: Decimal.Value
  sexo: BodyCompositionSex
}

export type BodyCompositionResult = {
  somaDobrasCutaneas: Decimal
  densidadeCorporal: Decimal
  percentualGordura: Decimal
  massaMagraKg: Decimal
  massaGordaKg: Decimal
}

export function calculateBodyComposition(input: BodyCompositionInput): BodyCompositionResult {
  const peitoral = toPositiveDecimal(input.peitoral, 'Peitoral')
  const abdominal = toPositiveDecimal(input.abdominal, 'Abdominal')
  const coxa = toPositiveDecimal(input.coxa, 'Coxa')
  const axilarMedia = toPositiveDecimal(input.axilarMedia, 'Axilar media')
  const subescapular = toPositiveDecimal(input.subescapular, 'Subescapular')
  const suprailiaca = toPositiveDecimal(input.suprailiaca, 'Suprailiaca')
  const triceps = toPositiveDecimal(input.triceps, 'Triceps')
  const altura = toPositiveDecimal(input.altura, 'Altura')
  const peso = toPositiveDecimal(input.peso, 'Peso corporal')

  const somaDobrasCutaneas = peitoral
    .plus(abdominal)
    .plus(coxa)
    .plus(axilarMedia)
    .plus(subescapular)
    .plus(suprailiaca)
    .plus(triceps)

  const somaAoQuadrado = somaDobrasCutaneas.pow(2)

  const densidadeCorporal =
    input.sexo === 'masculino'
      ? new Decimal(1.112)
          .minus(new Decimal('0.00043499').times(somaDobrasCutaneas))
          .plus(new Decimal('0.00000055').times(somaAoQuadrado))
          .minus(new Decimal('0.00028826').times(altura))
      : new Decimal(1.097)
          .minus(new Decimal('0.00046971').times(somaDobrasCutaneas))
          .plus(new Decimal('0.00000056').times(somaAoQuadrado))
          .minus(new Decimal('0.00012828').times(altura))

  const percentualGordura = new Decimal(4.95).div(densidadeCorporal).minus(4.5).times(100)
  const massaMagraKg = peso.times(new Decimal(1).minus(percentualGordura.div(100)))
  const massaGordaKg = peso.times(percentualGordura.div(100))

  return {
    somaDobrasCutaneas,
    densidadeCorporal,
    percentualGordura,
    massaMagraKg,
    massaGordaKg,
  }
}
