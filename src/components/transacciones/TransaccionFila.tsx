'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Trash2, Pencil, Lock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { eliminarTransaccion } from '@/app/actions/transactions'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import type { Transaction } from '@/types'

export default function TransaccionFila({
  transaction: t,
  onDeleted,
  onEdit,
  isLast,
}: {
  transaction: Transaction
  onDeleted: () => void
  onEdit: (t: Transaction) => void
  isLast: boolean
}) {
  const [deleting, setDeleting] = useState(false)
  const confirm = useConfirm()

  const isIngreso = t.type === 'ingreso'
  // Transacción generada por un aporte/pago: no editable (se desincronizaría con
  // la meta/deuda). Sí se puede borrar: eso revierte el aporte/pago de origen.
  const isAuto = !!t.auto_origin
  const Icon = isIngreso ? ArrowDownLeft : ArrowUpRight
  const iconBg = isIngreso ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'
  const iconColor = isIngreso ? '#4ade80' : '#f87171'
  const amountColor = isIngreso ? '#4ade80' : '#f87171'

  async function handleDelete() {
    const ok = await confirm({
      title: 'Eliminar transacción',
      message: isAuto
        ? 'Esta transacción se generó por un aporte/pago. Al eliminarla también se revierte ese aporte o pago de origen.'
        : '¿Seguro que querés eliminar esta transacción?',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!ok) return
    setDeleting(true)
    await eliminarTransaccion(t.id)
    onDeleted()
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 group transition-colors ${
        !isLast ? 'border-b border-fg/5' : ''
      } ${deleting ? 'opacity-40 pointer-events-none' : 'hover:bg-fg/[0.03]'}`}
    >
      {/* Tipo icon */}
      <div
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={15} strokeWidth={2.25} style={{ color: iconColor }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-fg truncate">
            {t.category}
          </span>
          {isAuto && (
            <span
              className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none"
              style={{ backgroundColor: 'rgba(59,127,245,0.15)', color: '#3b7ff5' }}
            >
              Automática
            </span>
          )}
          {t.description && (
            <span className="text-xs text-fg/40 truncate hidden sm:block">
              {t.description}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-fg/35">{formatDate(t.date)}</span>
          {t.description && (
            <span className="text-xs text-fg/35 truncate sm:hidden">
              · {t.description}
            </span>
          )}
        </div>
      </div>

      {/* Monto */}
      <span
        className="text-sm font-semibold tabular-nums shrink-0"
        style={{ color: amountColor }}
      >
        {isIngreso ? '+' : '-'}
        {formatCurrency(t.amount)}
      </span>

      {/* Acciones */}
      <div className="flex items-center gap-0.5 ml-0.5 shrink-0">
        {isAuto ? (
          <span
            className="p-1.5 rounded-md text-fg/20 cursor-not-allowed"
            title="Esta transacción se generó automáticamente. Editá el aporte o pago de origen."
            aria-label="Transacción automática (no editable)"
          >
            <Lock size={14} strokeWidth={1.75} />
          </span>
        ) : (
          <button
            onClick={() => onEdit(t)}
            disabled={deleting}
            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-md text-fg/25 hover:text-[#3b7ff5] hover:bg-[#3b7ff5]/10 transition-all cursor-pointer disabled:cursor-not-allowed"
            aria-label="Editar transacción"
          >
            <Pencil size={14} strokeWidth={1.75} />
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-md text-fg/25 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:cursor-not-allowed"
          aria-label="Eliminar transacción"
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
