// Única fuente de verdad de los features que se muestran en /pricing y /landing.
// Deben reflejar el gateo real del código: PLAN_LIMITS en lib/plans.ts y el
// chequeo de plan en app/actions/export.ts (exportar CSV es solo Pro).
export const FREE_FEATURES = [
  'Hasta 20 transacciones por mes',
  '1 meta de ahorro activa',
  '1 deuda activa',
  'Dashboard con gráficos',
  'Instalable como app',
]

export const PRO_FEATURES = [
  'Transacciones ilimitadas',
  'Metas de ahorro ilimitadas',
  'Deudas ilimitadas',
  'Dashboard con gráficos',
  'Exportar a CSV',
  'Instalable como app',
]
