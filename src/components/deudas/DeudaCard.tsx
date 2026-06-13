'use client'

import { useState } from 'react'
import { Trash2, Check, CreditCard, Banknote, Receipt, CalendarClock, Undo2 } from 'lucide-react'
import { formatCurrency, formatDate, proximoVencimiento } from '@/lib/utils'
import { eliminarDeuda, pagarCuota, revertirPago } from '@/app/actions/debts'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import type { Debt, DebtType, DebtPayment } from '@/types'

const TYPE_META: Record<DebtType, { label: string; Icon: typeof CreditCard }> = {
  prestamo: { label: 'Préstamo', Icon: Banknote },
  tarjeta: { label: 'Tarjeta', Icon: CreditCard },
  otro: { label: 'Otro', Icon: Receipt },
}

export default function DeudaCard({
  debt,
  lastPayment,
  onChanged,
}: {
  debt: Debt
  lastPayment: DebtPayment | null
  onChanged: () => void
}) {
  const [busy, setBusy] = useState<'delete' | 'pay' | 'revert' | null>(null)
  const confirm = useConfirm()

  const total = Number(debt.total_amount)
  const installmentAmount = Number(debt.installment_amount)
  const paid = debt.paid_installments
  const totalCuotas = debt.installments
  const saldada = paid >= totalCuotas

  const restante = total - installmentAmount * paid
  const progress = totalCuotas > 0 ? (paid / totalCuotas) * 100 : 0

  const { date: nextDueDate, daysUntil } = proximoVencimiento(debt.due_day)
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

  async function handleRevert() {
    if (!lastPayment) return
    const ok = await confirm({
      title: 'Revertir último pago',
      message: `¿Revertir el pago de ${formatCurrency(Number(lastPayment.amount))} del ${formatDate(lastPayment.date)}? También se borra su transacción de gasto.`,
      confirmLabel: 'Revertir',
      variant: 'danger',
    })
    if (!ok) return
    setBusy('revert')
    const result = await revertirPago(lastPayment.id)
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
        backgroundColor: 'var(--surface)',
        borderColor: saldada
          ? 'rgba(74,222,128,0.2)'
          : 'var(--hover)',
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
            <h3 className="text-base font-semibold text-fg truncate">
              {debt.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className="text-fg/40">{typeLabel}</span>
              <span className="text-fg/20">·</span>
              <span className="text-fg/40">
                Vto. día {debt.due_day} de cada mes
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={busy !== null}
          className="p-1.5 rounded-md text-fg/25 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
          aria-label="Eliminar deuda"
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      </div>

      {/* Cifras */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-xs text-fg/35 mb-0.5">Total</p>
          <p className="text-sm font-semibold text-fg tabular-nums">
            {formatCurrency(total)}
          </p>
        </div>
        <div>
          <p className="text-xs text-fg/35 mb-0.5">Por cuota</p>
          <p className="text-sm font-semibold text-fg tabular-nums">
            {formatCurrency(installmentAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-fg/35 mb-0.5">Restante</p>
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
              : 'var(--hover)',
          }}
        >
          <CalendarClock
            size={14}
            style={{
              color: vencimientoUrgente ? '#fbbf24' : 'var(--muted)',
            }}
          />
          <span className="text-xs text-fg/50">
            Próximo vencimiento:
          </span>
          <span
            className="text-xs font-semibold ml-auto"
            style={{ color: vencimientoUrgente ? '#fbbf24' : 'var(--fg)' }}
          >
            {formatDate(nextDueDate)}
            <span className="text-fg/40 font-normal ml-1.5">
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
          style={{ backgroundColor: 'var(--hover)' }}
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
          <span className="text-xs text-fg/40 tabular-nums">
            {progress.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Chips de cuotas */}
      <div className="flex flex-wrap gap-1.5 py-3 border-t border-fg/5">
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
                    : 'var(--hover)',
                color: isPaid
                  ? '#fff'
                  : isNext
                    ? '#3b7ff5'
                    : 'var(--muted)',
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
        <div className="pt-3 border-t border-fg/5 flex items-center justify-center gap-3">
          <span style={{ color: '#4ade80' }} className="text-sm font-medium">
            Deuda saldada ✓
          </span>
          {lastPayment && (
            <button
              onClick={handleRevert}
              disabled={busy !== null}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-fg/50 border border-fg/10 hover:bg-fg/5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Undo2 size={12} strokeWidth={2} />
              {busy === 'revert' ? 'Revirtiendo...' : 'Revertir último pago'}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-fg/5">
          <p className="text-xs text-fg/40">
            Inicio: {formatDate(debt.start_date)}
          </p>
          <div className="flex items-center gap-2">
            {lastPayment && (
              <button
                onClick={handleRevert}
                disabled={busy !== null}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-fg/50 border border-fg/10 hover:bg-fg/5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                title="Revertir el último pago registrado"
              >
                <Undo2 size={12} strokeWidth={2} />
                {busy === 'revert' ? 'Revirtiendo...' : 'Revertir'}
              </button>
            )}
            <button
              onClick={handlePay}
              disabled={busy !== null}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-fg transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#3b7ff5' }}
            >
              <Check size={13} strokeWidth={2.5} />
              {busy === 'pay' ? 'Pagando...' : `Pagar cuota ${paid + 1}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
