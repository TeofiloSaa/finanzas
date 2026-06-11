import type { AutoOrigin } from '@/types'

// Categorías de sistema. Una sola fuente de verdad de sus nombres: estos strings
// tienen que coincidir EXACTO con los sembrados por la migración (auto_transactions.sql)
// y con la categoría que asignan las RPC aporte_crear / pago_crear.
export const SYSTEM_CATEGORY_AHORROS = 'Ahorros'
export const SYSTEM_CATEGORY_PAGO_DEUDAS = 'Pago de deudas'

// Definición usada para sembrar las filas (color + sort_order al final de los gastos).
export const SYSTEM_CATEGORIES: {
  name: string
  color: string
  sort_order: number
}[] = [
  { name: SYSTEM_CATEGORY_AHORROS, color: '#14b8a6', sort_order: 100 },
  { name: SYSTEM_CATEGORY_PAGO_DEUDAS, color: '#a855f7', sort_order: 101 },
]

// Mapa origen automático -> categoría de sistema que le corresponde.
export const AUTO_ORIGIN_CATEGORY: Record<AutoOrigin, string> = {
  aporte_ahorro: SYSTEM_CATEGORY_AHORROS,
  pago_deuda: SYSTEM_CATEGORY_PAGO_DEUDAS,
}
