import type { Plan } from '@/types'

// Estados de Lemon Squeezy que dan acceso Pro inmediato.
const ACTIVE_STATUSES = new Set(['active', 'on_trial'])

// Traduce el estado de una suscripción de Lemon Squeezy (status + ends_at) al
// estado que persistimos en profiles. Es una función PURA: el webhook y la
// action cancelSubscription la usan para converger al mismo resultado, así un
// webhook duplicado, tardío, o que llega después de que la action ya escribió,
// deja siempre el mismo estado final (idempotencia).
//
//   - active / on_trial        -> Pro sin vencimiento (limpia una cancelación previa)
//   - cancelled + ends_at futuro -> Pro hasta ends_at (período pago vigente)
//   - cancelled vencida / expired / paused / past_due / unpaid -> Free
export function deriveSubscriptionState(
  status: string | null | undefined,
  endsAt: string | null | undefined,
  now: number = Date.now()
): { plan: Plan; planExpiresAt: string | null } {
  if (status && ACTIVE_STATUSES.has(status)) {
    return { plan: 'pro', planExpiresAt: null }
  }
  if (status === 'cancelled' && endsAt && Date.parse(endsAt) > now) {
    return { plan: 'pro', planExpiresAt: endsAt }
  }
  return { plan: 'free', planExpiresAt: null }
}
