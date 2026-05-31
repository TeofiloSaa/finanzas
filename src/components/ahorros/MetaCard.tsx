'use client'

import { useState } from 'react'
import { Trash2, Plus, Calendar, Check } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { eliminarMeta } from '@/app/actions/savings'
import type { SavingsGoal } from '@/types'

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
  onAportar,
  onDeleted,
}: {
  goal: SavingsGoal
  onAportar: () => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  const current = Number(goal.current_amount)
  const target = Number(goal.target_amount)
  const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0
  const restante = Math.max(0, target - current)

  const days = goal.deadline ? daysUntil(goal.deadline) : null
  const overdue = days !== null && days < 0 && !goal.completed
  const urgent = days !== null && days >= 0 && days <= 7 && !goal.completed

  const barColor = goal.completed ? '#4ade80' : '#3b7ff5'

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar la meta "${goal.name}"?`)) return
    setDeleting(true)
    await eliminarMeta(goal.id)
    onDeleted()
  }

  return (
    <div
      className={`rounded-xl border p-5 transition-opacity ${
        deleting ? 'opacity-40 pointer-events-none' : ''
      }`}
      style={{
        backgroundColor: '#1a1d27',
        borderColor: goal.completed
          ? 'rgba(74,222,128,0.2)'
          : 'rgba(255,255,255,0.05)',
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
            <h3 className="text-base font-semibold text-white truncate">
              {goal.name}
            </h3>
          </div>
          {goal.deadline && (
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar size={11} className="text-white/35" />
              <span className="text-white/45">{formatDate(goal.deadline)}</span>
              {!goal.completed && days !== null && (
                <span
                  className="ml-1"
                  style={{
                    color: overdue
                      ? '#f87171'
                      : urgent
                        ? '#fbbf24'
                        : 'rgba(255,255,255,0.3)',
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
          className="p-1.5 rounded-md text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
          aria-label="Eliminar meta"
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
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
          <span className="text-xs text-white/40 tabular-nums">
            {formatCurrency(current)} / {formatCurrency(target)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
        <div className="text-xs">
          {goal.completed ? (
            <span style={{ color: '#4ade80' }} className="font-medium">
              ¡Meta cumplida!
            </span>
          ) : (
            <>
              <span className="text-white/40">Falta </span>
              <span className="text-white font-semibold tabular-nums">
                {formatCurrency(restante)}
              </span>
            </>
          )}
        </div>

        {!goal.completed && (
          <button
            onClick={onAportar}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#3b7ff5' }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Aporte
          </button>
        )}
      </div>
    </div>
  )
}
