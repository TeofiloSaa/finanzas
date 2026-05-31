type CSVValue = string | number | boolean | null | undefined

function escapeField(value: CSVValue): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Entrecomillar si contiene separador, comillas o saltos de línea.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Arma un CSV a partir de encabezados y filas.
 * Antepone un BOM UTF-8 para que Excel respete los acentos.
 */
export function toCSV(headers: string[], rows: CSVValue[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeField).join(','))
  return '﻿' + lines.join('\r\n')
}
