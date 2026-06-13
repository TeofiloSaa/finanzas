'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { diasEntre } from '@/lib/utils'
import type { Debt } from '@/types'

interface DebtAlert {
  id: string
  name: string
  diffDays: number
  severity: 'red' | 'yellow'
  message: string
}

// Clave única por deuda + mes: al descartar, no reaparece hasta el mes siguiente.
function dismissKey(debtId: string, ref: Date) {
  return `debt-alert:${debtId}:${ref.getFullYear()}-${ref.getMonth()}`
}

export default function DebtAlerts() {
  const [alerts, setAlerts] = useState<DebtAlert[]>([])

  useEffect(() => {
    let active = true

    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)

      if (!active || !data) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const year = today.getFullYear()
      const month = today.getMonth()
      // Día válido máximo del mes actual (ej. due_day 31 en un mes de 30 días).
      const daysInMonth = new Date(year, month + 1, 0).getDate()

      const computed: DebtAlert[] = []

      for (const debt of data as Debt[]) {
        // Solo deudas activas (todavía con cuotas por pagar).
        if (debt.paid_installments >= debt.installments) continue

        const day = Math.min(debt.due_day, daysInMonth)
        const dueDate = new Date(year, month, day)
        const diffDays = diasEntre(today, dueDate)

        // Vence en más de 7 días → no es crítica.
        if (diffDays > 7) continue

        // Ya descartada este mes.
        if (localStorage.getItem(dismissKey(debt.id, today))) continue

        let message: string
        if (diffDays > 0) {
          message = `Vence en ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
        } else if (diffDays === 0) {
          message = 'Venció hoy'
        } else {
          const n = Math.abs(diffDays)
          message = `Vencida hace ${n} ${n === 1 ? 'día' : 'días'}`
        }

        const severity: 'red' | 'yellow' = diffDays <= 3 ? 'red' : 'yellow'

        computed.push({
          id: debt.id,
          name: debt.name,
          diffDays,
          severity,
          message,
        })
      }

      // Más urgente primero.
      computed.sort((a, b) => a.diffDays - b.diffDays)
      setAlerts(computed)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  function dismiss(id: string) {
    localStorage.setItem(dismissKey(id, new Date()), '1')
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  if (alerts.length === 0) return null

  return (
    <div className="flex flex-col gap-2 px-4 sm:px-6 pt-4 max-w-5xl mx-auto">
      {alerts.map((alert) => {
        const isRed = alert.severity === 'red'
        const color = isRed ? '#ef4444' : '#fbbf24'
        const bg = isRed ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)'

        return (
          <div
            key={alert.id}
            className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 rounded-lg border px-4 py-3"
            style={{ backgroundColor: bg, borderColor: color }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <AlertTriangle size={18} style={{ color }} className="shrink-0" />
              <p className="text-sm text-fg min-w-0 truncate">
                <span className="font-medium">{alert.name}</span>
                <span style={{ color }}> · {alert.message}</span>
              </p>
            </div>
            <button
              onClick={() => dismiss(alert.id)}
              className="self-end md:self-auto shrink-0 p-1 rounded-md transition-colors hover:bg-fg/5"
              style={{ color: 'var(--muted)' }}
              aria-label={`Descartar alerta de ${alert.name}`}
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
