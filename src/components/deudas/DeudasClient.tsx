'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CreditCard } from 'lucide-react'
import type { Debt, DebtPayment } from '@/types'
import DeudaCard from './DeudaCard'
import NuevaDeudaModal from './NuevaDeudaModal'

export default function DeudasClient({
  debts,
  payments,
}: {
  debts: Debt[]
  payments: DebtPayment[]
}) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  const { activas, saldadas } = useMemo(() => {
    const a: Debt[] = []
    const s: Debt[] = []
    for (const d of debts) {
      if (d.paid_installments >= d.installments) s.push(d)
      else a.push(d)
    }
    return { activas: a, saldadas: s }
  }, [debts])

  // Último pago revertible por deuda (payments ya viene desc por created_at).
  const lastPaymentByDebt = useMemo(() => {
    const map = new Map<string, DebtPayment>()
    for (const p of payments) {
      if (!map.has(p.debt_id)) map.set(p.debt_id, p)
    }
    return map
  }, [payments])

  function handleChanged() {
    router.refresh()
  }

  function handleSuccess() {
    setModalOpen(false)
    router.refresh()
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Deudas</h1>
          <p className="text-fg/40 mt-0.5 text-sm">
            {debts.length === 0
              ? 'Sin deudas registradas'
              : `${activas.length} activa${activas.length === 1 ? '' : 's'}${
                  saldadas.length > 0
                    ? ` · ${saldadas.length} saldada${saldadas.length === 1 ? '' : 's'}`
                    : ''
                }`}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-fg shrink-0 cursor-pointer transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#3b7ff5' }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nueva deuda</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* Empty */}
      {debts.length === 0 && (
        <div
          className="rounded-xl border border-fg/5 flex flex-col items-center justify-center py-16 px-4"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: 'rgba(59,127,245,0.12)' }}
          >
            <CreditCard
              size={22}
              style={{ color: '#3b7ff5' }}
              strokeWidth={1.75}
            />
          </div>
          <p className="text-fg/50 text-sm text-center mb-4">
            Registrá tus préstamos y tarjetas para seguir el pago de cuotas.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-fg cursor-pointer transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#3b7ff5' }}
          >
            Registrar primera deuda
          </button>
        </div>
      )}

      {/* Activas */}
      {activas.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-fg/40 mb-3 px-1">
            Activas
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {activas.map((d) => (
              <DeudaCard
                key={d.id}
                debt={d}
                lastPayment={lastPaymentByDebt.get(d.id) ?? null}
                onChanged={handleChanged}
              />
            ))}
          </div>
        </section>
      )}

      {/* Saldadas */}
      {saldadas.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-fg/40 mb-3 px-1 flex items-center gap-2">
            Saldadas
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-normal normal-case tracking-normal"
              style={{
                backgroundColor: 'rgba(74,222,128,0.12)',
                color: '#4ade80',
              }}
            >
              {saldadas.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {saldadas.map((d) => (
              <DeudaCard
                key={d.id}
                debt={d}
                lastPayment={lastPaymentByDebt.get(d.id) ?? null}
                onChanged={handleChanged}
              />
            ))}
          </div>
        </section>
      )}

      {modalOpen && (
        <NuevaDeudaModal
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
