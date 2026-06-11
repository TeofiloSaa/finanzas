'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Calendar, Check, ChevronDown, X } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { eliminarMeta, eliminarAporte } from '@/app/actions/savings'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import type { SavingsGoal, SavingsContribution } from '@/types'

function daysUntil(deadline: string): number {
  const [year, month, day] = deadline.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function MetaCard({
  goal,
  contributions,
  onAportar,
  onDeleted,
}: {
  goal: SavingsGoal
  contributions: SavingsContribution[]
  onAportar: () => void
  onDeleted: () => void
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const confirm = useConfirm()

  const current = Number(goal.current_amount)
  const target = Number(goal.target_amount)
  const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0
  const restante = Math.max(0, target - current)

  const days = goal.deadline ? daysUntil(goal.deadline) : null
  const overdue = days !== null && days < 0 && !goal.completed
  const urgent = days !== null && days >= 0 && days <= 7 && !goal.completed

  const barColor = goal.completed ? '#4ade80' : '#3b7ff5'

  async function handleDelete() {
    const ok = await confirm({
      title: 'Eliminar meta',
      message: `¿Seguro que querés eliminar la meta "${goal.name}"?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!ok) return
    setDeleting(true)
    await eliminarMeta(goal.id)
    onDeleted()
  }

  async function handleDeleteAporte(c: SavingsContribution) {
    const ok = await confirm({
      title: 'Eliminar aporte',
      message: `¿Eliminar el aporte de ${formatCurrency(Number(c.amount))} del ${formatDate(c.date)}? También se borra su transacción de gasto.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!ok) return
    setRemovingId(c.id)
    await eliminarAporte(c.id)
    router.refresh()
  }

  return (
    <div
      className={`rounded-xl border p-5 transition-opacity ${
        deleting ? 'opacity-40 pointer-events-none' : ''
      }`}
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: goal.completed
          ? 'rgba(74,222,128,0.2)'
          : 'var(--hover)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {goal.completed && (
              <div
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(74,222,128,0.15)' }}
              >
                <Check size={12} strokeWidth={3} style={{ color: '#4ade80' }} />
              </div>
            )}
            <h3 className="text-base font-semibold text-fg truncate">
              {goal.name}
            </h3>
          </div>
          {goal.deadline && (
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar size={11} className="text-fg/35" />
              <span className="text-fg/45">{formatDate(goal.deadline)}</span>
              {!goal.completed && days !== null && (
                <span
                  className="ml-1"
                  style={{
                    color: overdue
                      ? '#f87171'
                      : urgent
                        ? '#fbbf24'
                        : 'var(--muted)',
                  }}
                >
                  {overdue
                    ? `· vencida hace ${Math.abs(days)}d`
                    : days === 0
                      ? '· vence hoy'
                      : `· ${days}d restantes`}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-md text-fg/25 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
          aria-label="Eliminar meta"
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--hover)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: barColor }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: barColor }}
          >
            {progress.toFixed(0)}%
          </span>
          <span className="text-xs text-fg/40 tabular-nums">
            {formatCurrency(current)} / {formatCurrency(target)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-fg/5">
        <div className="text-xs">
          {goal.completed ? (
            <span style={{ color: '#4ade80' }} className="font-medium">
              ¡Meta cumplida!
            </span>
          ) : (
            <>
              <span className="text-fg/40">Falta </span>
              <span className="text-fg font-semibold tabular-nums">
                {formatCurrency(restante)}
              </span>
            </>
          )}
        </div>

        {!goal.completed && (
          <button
            onClick={onAportar}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-fg transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#3b7ff5' }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Aporte
          </button>
        )}
      </div>

      {/* Historial de aportes */}
      {contributions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-fg/5">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-fg/45 hover:text-fg/70 transition-colors cursor-pointer"
            aria-expanded={expanded}
          >
            <ChevronDown
              size={13}
              strokeWidth={2}
              className="transition-transform"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
            />
            {contributions.length} aporte{contributions.length === 1 ? '' : 's'}
          </button>

          {expanded && (
            <ul className="mt-2 flex flex-col gap-1">
              {contributions.map((c) => (
                <li
                  key={c.id}
                  className={`flex items-center justify-between gap-2 text-xs py-1 transition-opacity ${
                    removingId === c.id ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <span className="text-fg/40">{formatDate(c.date)}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-fg/70 font-medium tabular-nums">
                      {formatCurrency(Number(c.amount))}
                    </span>
                    <button
                      onClick={() => handleDeleteAporte(c)}
                      disabled={removingId === c.id}
                      className="p-1 rounded text-fg/25 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Eliminar aporte"
                    >
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
