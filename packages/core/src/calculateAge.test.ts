import { describe, expect, it } from 'vitest'
import { calculateAge } from './calculateAge'

describe('calculateAge', () => {
  it('calcula idade corretamente', () => {
    const ref = new Date('2025-06-01')
    expect(calculateAge('1990-06-01', ref)).toBe(35)
  })

  it('subtrai 1 ano quando aniversário ainda não ocorreu no ano de referência', () => {
    const ref = new Date('2025-05-01')
    expect(calculateAge('1990-06-01', ref)).toBe(34)
  })

  it('aceita string ISO como data de nascimento', () => {
    const ref = new Date('2025-01-01')
    expect(calculateAge('2000-01-01', ref)).toBe(25)
  })

  it('lança erro para data de nascimento inválida', () => {
    expect(() => calculateAge('data-invalida')).toThrow('Data de nascimento inválida.')
  })

  it('lança erro para data de nascimento no futuro', () => {
    const ref = new Date('2020-01-01')
    expect(() => calculateAge('2025-01-01', ref)).toThrow('Data de nascimento no futuro não é permitida.')
  })
})
