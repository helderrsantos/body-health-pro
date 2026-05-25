import { describe, expect, it } from 'vitest'
import { calculateBMI } from './calculateBMI'

describe('calculateBMI', () => {
  it('calcula IMC corretamente', () => {
    // 70kg / (1.75m)² = 22.857...
    const result = calculateBMI(70, 175)
    expect(result.toNumber()).toBeCloseTo(22.86, 1)
  })

  it('lança erro para peso zero', () => {
    expect(() => calculateBMI(0, 175)).toThrow()
  })

  it('lança erro para altura zero', () => {
    expect(() => calculateBMI(70, 0)).toThrow()
  })

  it('lança erro para valores negativos', () => {
    expect(() => calculateBMI(-70, 175)).toThrow()
    expect(() => calculateBMI(70, -175)).toThrow()
  })

  it('aceita Decimal como entrada', () => {
    const result = calculateBMI('80.5', '180')
    expect(result.toNumber()).toBeCloseTo(24.84, 1)
  })
})
