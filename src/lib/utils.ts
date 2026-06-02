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

// Formatea lo que el usuario escribe en un input de monto: descarta todo lo que
// no sea dígito y agrupa de a 3 con punto (formato argentino). Ej: "1000000" -> "1.000.000".
export function formatInputMonto(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Limpia un monto formateado y lo devuelve como número entero. Ej: "1.000.000" -> 1000000.
export function parseInputMonto(value: string): number {
  const digits = value.replace(/\D/g, '')
  return digits ? parseInt(digits, 10) : 0
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
