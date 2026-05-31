'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Trash2, Pencil } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { eliminarTransaccion } from '@/app/actions/transactions'
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

  const isIngreso = t.type === 'ingreso'
  const Icon = isIngreso ? ArrowDownLeft : ArrowUpRight
  const iconBg = isIngreso ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'
  const iconColor = isIngreso ? '#4ade80' : '#f87171'
  const amountColor = isIngreso ? '#4ade80' : '#f87171'

  async function handleDelete() {
    if (!window.confirm('¿Eliminar esta transacción?')) return
    setDeleting(true)
    await eliminarTransaccion(t.id)
    onDeleted()
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 group transition-colors ${
        !isLast ? 'border-b border-white/5' : ''
      } ${deleting ? 'opacity-40 pointer-events-none' : 'hover:bg-white/[0.03]'}`}
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
          <span className="text-sm font-medium text-white truncate">
            {t.category}
          </span>
          {t.description && (
            <span className="text-xs text-white/40 truncate hidden sm:block">
              {t.description}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-white/35">{formatDate(t.date)}</span>
          {t.description && (
            <span className="text-xs text-white/35 truncate sm:hidden">
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
        <button
          onClick={() => onEdit(t)}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-md text-white/25 hover:text-[#3b7ff5] hover:bg-[#3b7ff5]/10 transition-all cursor-pointer disabled:cursor-not-allowed"
          aria-label="Editar transacción"
        >
          <Pencil size={14} strokeWidth={1.75} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-md text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:cursor-not-allowed"
          aria-label="Eliminar transacción"
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
