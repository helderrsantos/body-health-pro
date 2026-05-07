export function calculateAge(dateOfBirth: Date | string, referenceDate = new Date()): number {
  const birthDate =
    dateOfBirth instanceof Date ? new Date(dateOfBirth.getTime()) : new Date(dateOfBirth)

  if (Number.isNaN(birthDate.getTime())) {
    throw new Error('Data de nascimento invalida.')
  }

  let age = referenceDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age -= 1
  }

  if (age < 0) {
    throw new Error('Data de nascimento no futuro nao e permitida.')
  }

  return age
}
