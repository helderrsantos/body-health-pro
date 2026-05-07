import Decimal from 'decimal.js'
import { toPositiveDecimal } from './decimal'

export function calculateBMI(weightKg: Decimal.Value, heightCm: Decimal.Value): Decimal {
  const weight = toPositiveDecimal(weightKg, 'Peso')
  const heightMeters = toPositiveDecimal(heightCm, 'Altura').div(100)

  return weight.div(heightMeters.pow(2))
}
