'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, PiggyBank } from 'lucide-react'
import type { SavingsGoal } from '@/types'
import MetaCard from './MetaCard'
import NuevaMetaModal from './NuevaMetaModal'
import NuevoAporteModal from './NuevoAporteModal'

export default function AhorrosClient({ goals }: { goals: SavingsGoal[] }) {
  const router = useRouter()
  const [nuevaOpen, setNuevaOpen] = useState(false)
  const [aporteGoal, setAporteGoal] = useState<SavingsGoal | null>(null)

  const { activas, completadas } = useMemo(() => {
    const a: SavingsGoal[] = []
    const c: SavingsGoal[] = []
    for (const g of goals) {
      if (g.completed) c.push(g)
      else a.push(g)
    }
    return { activas: a, completadas: c }
  }, [goals])

  function handleSuccess() {
    setNuevaOpen(false)
    setAporteGoal(null)
    router.refresh()
  }

  function handleDeleted() {
    router.refresh()
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Ahorros</h1>
          <p className="text-fg/40 mt-0.5 text-sm">
            {goals.length === 0
              ? 'Sin metas todavía'
              : `${activas.length} activa${activas.length === 1 ? '' : 's'}${
                  completadas.length > 0
                    ? ` · ${completadas.length} completada${completadas.length === 1 ? '' : 's'}`
                    : ''
                }`}
          </p>
        </div>
        <button
          onClick={() => setNuevaOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-fg shrink-0 cursor-pointer transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#3b7ff5' }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nueva meta</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* Empty state */}
      {goals.length === 0 && (
        <div
          className="rounded-xl border border-fg/5 flex flex-col items-center justify-center py-16 px-4"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: 'rgba(59,127,245,0.12)' }}
          >
            <PiggyBank size={22} style={{ color: '#3b7ff5' }} strokeWidth={1.75} />
          </div>
          <p className="text-fg/50 text-sm text-center mb-4">
            Definí tu primera meta de ahorro para empezar a hacer seguimiento.
          </p>
          <button
            onClick={() => setNuevaOpen(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-fg cursor-pointer transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#3b7ff5' }}
          >
            Crear primera meta
          </button>
        </div>
      )}

      {/* Metas activas */}
      {activas.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-fg/40 mb-3 px-1">
            Activas
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {activas.map((g) => (
              <MetaCard
                key={g.id}
                goal={g}
                onAportar={() => setAporteGoal(g)}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        </section>
      )}

      {/* Metas completadas */}
      {completadas.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-fg/40 mb-3 px-1 flex items-center gap-2">
            Completadas
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-normal normal-case tracking-normal"
              style={{
                backgroundColor: 'rgba(74,222,128,0.12)',
                color: '#4ade80',
              }}
            >
              {completadas.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {completadas.map((g) => (
              <MetaCard
                key={g.id}
                goal={g}
                onAportar={() => setAporteGoal(g)}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      {nuevaOpen && (
        <NuevaMetaModal
          onClose={() => setNuevaOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
      {aporteGoal && (
        <NuevoAporteModal
          goal={aporteGoal}
          onClose={() => setAporteGoal(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
