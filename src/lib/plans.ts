import type { Plan } from '@/types'

// Acciones cuyo uso está limitado según el plan.
export type LimitedAction = 'transactions' | 'goals' | 'debts'

// Límites por plan. Free es acotado; Pro es ilimitado (Infinity).
// transactions: por mes calendario. goals/debts: cantidad activa simultánea.
export const PLAN_LIMITS: Record<Plan, Record<LimitedAction, number>> = {
  free: { transactions: 20, goals: 1, debts: 1 },
  pro: { transactions: Infinity, goals: Infinity, debts: Infinity },
}

// El usuario es Pro si plan='pro' Y la suscripción no venció: planExpiresAt null
// (Pro activo, sin vencimiento) o todavía en el futuro (cancelado pero dentro del
// período pago). Al comparar contra Date.now() en cada llamada, la expiración se
// aplica sola, sin necesitar un cron que baje el plan al vencer.
export function isPro(plan: Plan, planExpiresAt?: string | null): boolean {
  if (plan !== 'pro') return false
  if (!planExpiresAt) return true
  return Date.parse(planExpiresAt) > Date.now()
}

// Plan efectivo para el gateo de límites: un Pro vencido se trata como Free.
// Úsalo antes de canPerformAction cuando leés plan + plan_expires_at de la DB.
export function effectivePlan(plan: Plan, planExpiresAt?: string | null): Plan {
  return isPro(plan, planExpiresAt) ? 'pro' : 'free'
}

// currentCount = cantidad ya existente para esa acción.
// Devuelve true si el usuario todavía puede crear una más sin pasar el límite.
export function canPerformAction(
  plan: Plan,
  action: LimitedAction,
  currentCount: number
): boolean {
  return currentCount < PLAN_LIMITS[plan][action]
}
