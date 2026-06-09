'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Crown, Loader2 } from 'lucide-react'
import {
  createCheckoutSession,
  cancelSubscription,
} from '@/app/actions/subscription'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { isPro } from '@/lib/plans'
import type { Plan } from '@/types'

const FREE_FEATURES = [
  'Hasta 20 transacciones por mes',
  '1 meta de ahorro activa',
  '1 deuda activa',
  'Dashboard y gráficos',
  'Exportar a CSV',
]

const PRO_FEATURES = [
  'Transacciones ilimitadas',
  'Metas de ahorro ilimitadas',
  'Deudas ilimitadas',
  'Dashboard y gráficos',
  'Exportar a CSV',
  'Soporte prioritario',
]

export default function PricingClient({
  plan,
  subscriptionId,
}: {
  plan: Plan
  subscriptionId: string | null
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pro = isPro(plan)

  async function handleUpgrade() {
    setError(null)
    setLoading(true)
    const res = await createCheckoutSession()
    if ('error' in res) {
      setError(res.error)
      setLoading(false)
      return
    }
    window.location.href = res.url
  }

  async function handleCancel() {
    if (!subscriptionId) return
    const ok = await confirm({
      title: 'Cancelar suscripción',
      message:
        '¿Seguro que querés cancelar tu plan Pro? Volverás al plan Free y perderás los límites ampliados.',
      confirmLabel: 'Cancelar plan',
      cancelLabel: 'Volver',
      variant: 'danger',
    })
    if (!ok) return

    setError(null)
    setLoading(true)
    const res = await cancelSubscription(subscriptionId)
    setLoading(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-fg">Plan</h1>
        <p className="text-fg/40 mt-0.5 text-sm">
          Elegí el plan que mejor se adapte a vos
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg px-4 py-3 mb-4 text-sm"
          style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: '#f87171' }}
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Free */}
        <section
          className="rounded-xl border border-fg/5 p-6 flex flex-col"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <div className="mb-4">
            <h2 className="text-base font-semibold text-fg">Free</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-fg">$0</span>
              <span className="text-sm text-fg/40">/mes</span>
            </div>
          </div>

          <ul className="flex flex-col gap-2.5 flex-1">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-fg/70">
                <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-fg/40" />
                {f}
              </li>
            ))}
          </ul>

          {!pro && (
            <div
              className="mt-6 text-center text-sm font-medium py-2.5 rounded-lg border border-fg/10 text-fg/50"
            >
              Tu plan actual
            </div>
          )}
        </section>

        {/* Pro */}
        <section
          className="rounded-xl p-6 flex flex-col relative"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid #3b7ff5',
          }}
        >
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Crown size={18} strokeWidth={1.75} style={{ color: '#3b7ff5' }} />
              <h2 className="text-base font-semibold text-fg">Pro</h2>
              {pro && (
                <span
                  className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(59,127,245,0.15)', color: '#3b7ff5' }}
                >
                  Plan activo
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-fg">$3.99</span>
              <span className="text-sm text-fg/40">/mes</span>
            </div>
          </div>

          <ul className="flex flex-col gap-2.5 flex-1">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-fg/70">
                <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color: '#3b7ff5' }} />
                {f}
              </li>
            ))}
          </ul>

          {pro ? (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="mt-6 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-fg/60 border border-fg/10 hover:bg-fg/5 transition-colors cursor-pointer disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Cancelar suscripción
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading}
              className="mt-6 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: '#3b7ff5' }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Upgrade a Pro
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
