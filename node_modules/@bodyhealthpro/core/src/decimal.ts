import Decimal from 'decimal.js'

function normalizeDecimalInput(value: Decimal.Value): Decimal.Value {
  if (typeof value === 'string') {
    return value.trim().replace(',', '.')
  }

  return value
}

export function toPositiveDecimal(value: Decimal.Value, fieldName: string): Decimal {
  const decimalValue = new Decimal(normalizeDecimalInput(value))

  if (!decimalValue.isFinite() || decimalValue.lte(0)) {
    throw new Error(`${fieldName} deve ser maior que zero.`)
  }

  return decimalValue
}

export function toPositiveIntegerDecimal(
  value: Decimal.Value,
  fieldName: string,
): Decimal {
  const decimalValue = toPositiveDecimal(value, fieldName)

  if (!decimalValue.isInteger()) {
    throw new Error(`${fieldName} deve ser um inteiro positivo.`)
  }

  return decimalValue
}
