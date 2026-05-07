import Decimal from 'decimal.js'

function normalizeInput(rawValue: string): string {
  return rawValue.trim().replace(',', '.')
}

function parsePositiveDecimal(value: string): Decimal | null {
  if (value.trim() === '') {
    return null
  }

  try {
    const parsed = new Decimal(normalizeInput(value))

    if (!parsed.isFinite() || parsed.lte(0)) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export const validation = {
  positiveDecimal(value: string, label: string): string | null {
    if (value.trim() === '') {
      return `${label} e obrigatorio.`
    }

    if (!parsePositiveDecimal(value)) {
      return `${label} deve ser um numero positivo.`
    }

    return null
  },

  positiveInteger(value: string, label: string): string | null {
    if (value.trim() === '') {
      return `${label} e obrigatorio.`
    }

    const parsed = parsePositiveDecimal(value)

    if (parsed?.isInteger() !== true) {
      return `${label} deve ser um inteiro positivo.`
    }

    return null
  },

  selectRequired(value: string, label: string): string | null {
    if (value.trim() === '') {
      return `${label} e obrigatorio.`
    }

    return null
  },
}
