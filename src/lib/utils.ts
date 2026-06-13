export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount)
}

export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Formatea lo que el usuario escribe en un input de monto en formato argentino:
// agrupa la parte entera de a 3 con punto y admite hasta 2 decimales tras la coma.
// Ej: "1000000" -> "1.000.000", "1500,5" -> "1.500,5", "1500,50" -> "1.500,50".
export function formatInputMonto(value: string): string {
  // Conservamos solo dígitos y comas; el punto que tipee el usuario se ignora
  // (es separador de miles visual, la coma es el separador decimal es-AR).
  const cleaned = value.replace(/[^\d,]/g, '')
  const firstComma = cleaned.indexOf(',')
  if (firstComma === -1) {
    const intPart = cleaned.replace(/^0+(?=\d)/, '')
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }
  // Parte entera agrupada + parte decimal (sin comas extra, máximo 2 dígitos).
  const intPart = cleaned.slice(0, firstComma).replace(/^0+(?=\d)/, '')
  const decPart = cleaned.slice(firstComma + 1).replace(/,/g, '').slice(0, 2)
  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${groupedInt || '0'},${decPart}`
}

// Limpia un monto formateado y lo devuelve como número (con decimales).
// Ej: "1.000.000" -> 1000000, "1.500,50" -> 1500.5.
export function parseInputMonto(value: string): number {
  // Quitamos los puntos de miles y pasamos la coma decimal a punto para parseFloat.
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(normalized)
  return isNaN(n) ? 0 : n
}

// Política de contraseñas: mínimo 8 caracteres y al menos 1 número.
// Devuelve el mensaje de error a mostrar, o null si la contraseña es válida.
// Se usa tanto en el cliente (validación inline) como en el servidor (autoritativo).
export const PASSWORD_RULE_HINT = 'La contraseña debe tener al menos 8 caracteres y un número.'

export function validatePassword(password: string): string | null {
  if (password.length < 8) return PASSWORD_RULE_HINT
  if (!/\d/.test(password)) return PASSWORD_RULE_HINT
  return null
}
