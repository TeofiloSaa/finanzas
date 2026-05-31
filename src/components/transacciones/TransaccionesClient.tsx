'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import type { Transaction, Category } from '@/types'
import TransaccionFila from './TransaccionFila'
import NuevaTransaccionModal from './NuevaTransaccionModal'

type FilterType = 'todos' | 'ingreso' | 'gasto'

const TYPE_LABELS: Record<FilterType, string> = {
  todos: 'Todos',
  ingreso: 'Ingresos',
  gasto: 'Gastos',
}

function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  const label = new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
  }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function TransaccionesClient({
  transactions,
  categories,
}: {
  transactions: Transaction[]
  categories: Category[]
}) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [filterType, setFilterType] = useState<FilterType>('todos')
  const [filterMonth, setFilterMonth] = useState('')

  const availableMonths = useMemo(() => {
    const months = [...new Set(transactions.map((t) => t.date.substring(0, 7)))]
    return months.sort().reverse()
  }, [transactions])

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'todos' && t.type !== filterType) return false
      if (filterMonth && !t.date.startsWith(filterMonth)) return false
      return true
    })
  }, [transactions, filterType, filterMonth])

  function handleSuccess() {
    setModalOpen(false)
    setEditingTx(null)
    router.refresh()
  }

  function handleDeleted() {
    router.refresh()
  }

  function handleEdit(t: Transaction) {
    setEditingTx(t)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingTx(null)
  }

  const totalIngresos = filtered
    .filter((t) => t.type === 'ingreso')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalGastos = filtered
    .filter((t) => t.type === 'gasto')
    .reduce((sum, t) => sum + t.amount, 0)

  const formatARS = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Transacciones</h1>
          <p className="text-fg/40 mt-0.5 text-sm">
            {filtered.length !== transactions.length
              ? `${filtered.length} de ${transactions.length}`
              : transactions.length === 1
                ? '1 transacción'
                : `${transactions.length} transacciones`}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-fg shrink-0 cursor-pointer transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#3b7ff5' }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nueva transacción</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* Resumen rápido — solo visible si hay datos filtrados */}
      {filtered.length > 0 && filterType === 'todos' && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Ingresos', value: totalIngresos, color: '#4ade80' },
            { label: 'Gastos', value: totalGastos, color: '#f87171' },
            {
              label: 'Balance',
              value: totalIngresos - totalGastos,
              color: totalIngresos >= totalGastos ? '#4ade80' : '#f87171',
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-fg/5 px-4 py-3"
              style={{ backgroundColor: 'var(--surface)' }}
            >
              <p className="text-xs text-fg/40 mb-1">{label}</p>
              <p className="text-sm font-semibold tabular-nums" style={{ color }}>
                {formatARS(Math.abs(value))}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Tipo */}
        <div
          className="flex rounded-lg p-0.5 gap-0.5"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          {(['todos', 'ingreso', 'gasto'] as FilterType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor:
                  filterType === t ? 'var(--background)' : 'transparent',
                color:
                  filterType === t ? 'var(--fg)' : 'var(--muted)',
              }}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Mes */}
        {availableMonths.length > 1 && (
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs text-fg border border-fg/10 outline-none cursor-pointer"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <option value="">Todos los meses</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl border border-fg/5 flex flex-col items-center justify-center py-16 px-4"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <p className="text-fg/35 text-sm text-center">
            {transactions.length === 0
              ? 'Aún no tenés transacciones. ¡Registrá la primera!'
              : 'Sin resultados para los filtros seleccionados.'}
          </p>
          {transactions.length === 0 && (
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-fg cursor-pointer transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#3b7ff5' }}
            >
              Registrar transacción
            </button>
          )}
        </div>
      ) : (
        <div
          className="rounded-xl border border-fg/5 overflow-hidden"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          {filtered.map((t, i) => (
            <TransaccionFila
              key={t.id}
              transaction={t}
              onDeleted={handleDeleted}
              onEdit={handleEdit}
              isLast={i === filtered.length - 1}
            />
          ))}
        </div>
      )}

      {/* Modal — sirve para crear y editar */}
      {(modalOpen || editingTx) && (
        <NuevaTransaccionModal
          key={editingTx?.id ?? 'new'}
          transaction={editingTx}
          categories={categories}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
