export function formatDateBR(dateValue?: string | null): string {
  if (!dateValue) return '-'

  try {
    const normalizedDate = dateValue.includes('T') ? dateValue : `${dateValue}T00:00:00`
    return new Date(normalizedDate).toLocaleDateString('pt-BR')
  } catch {
    return dateValue
  }
}
