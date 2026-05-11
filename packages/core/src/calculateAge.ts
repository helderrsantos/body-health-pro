export function calculateAge(dateOfBirth: Date | string, referenceDate = new Date()): number {
  const birthDate = new Date(dateOfBirth)

  if (Number.isNaN(birthDate.getTime())) {
    throw new TypeError('Data de nascimento inválida.')
  }

  let age = referenceDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age -= 1
  }

  if (age < 0) {
    throw new Error('Data de nascimento no futuro não é permitida.')
  }

  return age
}
