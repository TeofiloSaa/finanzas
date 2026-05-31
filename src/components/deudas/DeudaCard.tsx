'use client'

import { useState } from 'react'
import { Trash2, Check, CreditCard, Banknote, Receipt, CalendarClock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { eliminarDeuda, pagarCuota } from '@/app/actions/debts'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import type { Debt, DebtType } from '@/types'

const TYPE_META: Record<DebtType, { label: string; Icon: typeof CreditCard }> = {
  prestamo: { label: 'Préstamo', Icon: Banknote },
  tarjeta: { label: 'Tarjeta', Icon: CreditCard },
  otro: { label: 'Otro', Icon: Receipt },
}

function calcularProximoVencimiento(dueDay: number): {
  date: Date
  daysUntil: number
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()
  const month = today.getMonth()

  const daysInThisMonth = new Date(year, month + 1, 0).getDate()
  const thisMonthDue = Math.min(dueDay, daysInThisMonth)
  const candidateThisMonth = new Date(year, month, thisMonthDue)

  let target: Date
  if (today.getTime() <= candidateThisMonth.getTime()) {
    target = candidateThisMonth
  } else {
    const daysInNextMonth = new Date(year, month + 2, 0).getDate()
    const nextMonthDue = Math.min(dueDay, daysInNextMonth)
    target = new Date(year, month + 1, nextMonthDue)
  }

  const daysUntil = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
  return { date: target, daysUntil }
}

function formatDateObj(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export default function DeudaCard({
  debt,
  onChanged,
}: {
  debt: Debt
  onChanged: () => void
}) {
  const [busy, setBusy] = useState<'delete' | 'pay' | null>(null)
  const confirm = useConfirm()

  const total = Number(debt.total_amount)
  const installmentAmount = Number(debt.installment_amount)
  const paid = debt.paid_installments
  const totalCuotas = debt.installments
  const saldada = paid >= totalCuotas

  const restante = total - installmentAmount * paid
  const progress = totalCuotas > 0 ? (paid / totalCuotas) * 100 : 0

  const { date: nextDueDate, daysUntil } = calcularProximoVencimiento(debt.due_day)
  const vencimientoUrgente = !saldada && daysUntil >= 0 && daysUntil <= 3

  const { label: typeLabel, Icon: TypeIcon } = TYPE_META[debt.type]

  async function handleDelete() {
    const ok = await confirm({
      title: 'Eliminar deuda',
      message: `¿Seguro que querés eliminar la deuda "${debt.name}"?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!ok) return
    setBusy('delete')
    await eliminarDeuda(debt.id)
    onChanged()
  }

  async function handlePay() {
    setBusy('pay')
    const result = await pagarCuota(debt.id)
    setBusy(null)
    if (result?.error) {
      window.alert(result.error)
      return
    }
    onChanged()
  }

  return (
    <div
      className={`rounded-xl border p-5 transition-opacity ${
        busy === 'delete' ? 'opacity-40 pointer-events-none' : ''
      }`}
      style={{
        backgroundColor: '#1a1d27',
        borderColor: saldada
          ? 'rgba(74,222,128,0.2)'
          : 'rgba(255,255,255,0.05)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1 flex items-start gap-3">
          <div
            className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: saldada
                ? 'rgba(74,222,128,0.12)'
                : 'rgba(59,127,245,0.12)',
              color: saldada ? '#4ade80' : '#3b7ff5',
            }}
          >
            {saldada ? (
              <Check size={18} strokeWidth={2.5} />
            ) : (
              <TypeIcon size={18} strokeWidth={1.75} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-white truncate">
              {debt.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className="text-white/40">{typeLabel}</span>
              <span className="text-white/20">·</span>
              <span className="text-white/40">
                Vto. día {debt.due_day} de cada mes
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={busy !== null}
          className="p-1.5 rounded-md text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
          aria-label="Eliminar deuda"
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      </div>

      {/* Cifras */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-xs text-white/35 mb-0.5">Total</p>
          <p className="text-sm font-semibold text-white tabular-nums">
            {formatCurrency(total)}
          </p>
        </div>
        <div>
          <p className="text-xs text-white/35 mb-0.5">Por cuota</p>
          <p className="text-sm font-semibold text-white tabular-nums">
            {formatCurrency(installmentAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-white/35 mb-0.5">Restante</p>
          <p
            className="text-sm font-semibold tabular-nums"
            style={{ color: saldada ? '#4ade80' : '#f87171' }}
          >
            {formatCurrency(Math.max(0, restante))}
          </p>
        </div>
      </div>

      {/* Próximo vencimiento */}
      {!saldada && (
        <div
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: vencimientoUrgente
              ? 'rgba(251,191,36,0.08)'
              : 'rgba(255,255,255,0.03)',
          }}
        >
          <CalendarClock
            size={14}
            style={{
              color: vencimientoUrgente ? '#fbbf24' : 'rgba(255,255,255,0.4)',
            }}
          />
          <span className="text-xs text-white/50">
            Próximo vencimiento:
          </span>
          <span
            className="text-xs font-semibold ml-auto"
            style={{ color: vencimientoUrgente ? '#fbbf24' : '#fff' }}
          >
            {formatDateObj(nextDueDate)}
            <span className="text-white/40 font-normal ml-1.5">
              {daysUntil === 0
                ? '(hoy)'
                : daysUntil === 1
                  ? '(mañana)'
                  : `(en ${daysUntil}d)`}
            </span>
          </span>
        </div>
      )}

      {/* Barra de progreso */}
      <div className="mb-3">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: saldada ? '#4ade80' : '#3b7ff5',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: saldada ? '#4ade80' : '#3b7ff5' }}
          >
            {paid} / {totalCuotas} cuotas pagadas
          </span>
          <span className="text-xs text-white/40 tabular-nums">
            {progress.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Chips de cuotas */}
      <div className="flex flex-wrap gap-1.5 py-3 border-t border-white/5">
        {Array.from({ length: totalCuotas }, (_, i) => {
          const n = i + 1
          const isPaid = n <= paid
          const isNext = !saldada && n === paid + 1
          return (
            <div
              key={n}
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold tabular-nums transition-all"
              style={{
                backgroundColor: isPaid
                  ? '#3b7ff5'
                  : isNext
                    ? 'rgba(59,127,245,0.08)'
                    : 'rgba(255,255,255,0.04)',
                color: isPaid
                  ? '#fff'
                  : isNext
                    ? '#3b7ff5'
                    : 'rgba(255,255,255,0.25)',
                border: isNext ? '1px dashed #3b7ff5' : '1px solid transparent',
              }}
              title={
                isPaid
                  ? `Cuota ${n} pagada`
                  : isNext
                    ? `Próxima cuota: ${n}`
                    : `Cuota ${n}`
              }
            >
              {n}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {saldada ? (
        <div className="pt-3 text-center">
          <span style={{ color: '#4ade80' }} className="text-sm font-medium">
            Deuda saldada ✓
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
          <p className="text-xs text-white/40">
            Inicio: {formatDate(debt.start_date)}
          </p>
          <button
            onClick={handlePay}
            disabled={busy !== null}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#3b7ff5' }}
          >
            <Check size={13} strokeWidth={2.5} />
            {busy === 'pay' ? 'Pagando...' : `Pagar cuota ${paid + 1}`}
          </button>
        </div>
      )}
    </div>
  )
}
