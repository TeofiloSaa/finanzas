import type { Plan } from '@/types'

// Acciones cuyo uso está limitado según el plan.
export type LimitedAction = 'transactions' | 'goals' | 'debts'

// Límites por plan. Free es acotado; Pro es ilimitado (Infinity).
// transactions: por mes calendario. goals/debts: cantidad activa simultánea.
export const PLAN_LIMITS: Record<Plan, Record<LimitedAction, number>> = {
  free: { transactions: 20, goals: 1, debts: 1 },
  pro: { transactions: Infinity, goals: Infinity, debts: Infinity },
}

export function isPro(plan: Plan): boolean {
  return plan === 'pro'
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
