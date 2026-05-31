import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown, Wallet, CalendarClock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import GastosDonut from '@/components/dashboard/GastosDonut'
import IngresosGastosBar from '@/components/dashboard/IngresosGastosBar'
import type { Transaction, SavingsGoal, Debt } from '@/types'

export const revalidate = 30

const MONTHS_ES_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MONTHS_ES_LONG = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toDateString(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function calcularProximoVencimiento(dueDay: number): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const y = today.getFullYear()
  const m = today.getMonth()
  const daysInThisMonth = new Date(y, m + 1, 0).getDate()
  const candidate = new Date(y, m, Math.min(dueDay, daysInThisMonth))
  if (today.getTime() <= candidate.getTime()) return candidate
  const daysInNext = new Date(y, m + 2, 0).getDate()
  return new Date(y, m + 1, Math.min(dueDay, daysInNext))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Rango: desde el primer día del mes hace 5 meses, hasta el primer día del mes siguiente al actual
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const sixMonthsStart = new Date(currentYear, currentMonth - 5, 1)
  const nextMonthStart = new Date(currentYear, currentMonth + 1, 1)
  const currentMonthStart = `${currentYear}-${pad(currentMonth + 1)}-01`

  const startStr = toDateString(sixMonthsStart)
  const endStr = toDateString(nextMonthStart)

  const [txRes, goalsRes, debtsRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startStr)
      .lt('date', endStr),
    supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const transactions = (txRes.data ?? []) as Transaction[]
  const goals = (goalsRes.data ?? []) as SavingsGoal[]
  const allDebts = (debtsRes.data ?? []) as Debt[]
  const deudasActivas = allDebts.filter((d) => d.paid_installments < d.installments)

  // --- Mes actual ---
  const txMesActual = transactions.filter((t) => t.date >= currentMonthStart)
  const ingresosMes = txMesActual
    .filter((t) => t.type === 'ingreso')
    .reduce((s, t) => s + Number(t.amount), 0)
  const gastosMes = txMesActual
    .filter((t) => t.type === 'gasto')
    .reduce((s, t) => s + Number(t.amount), 0)
  const balance = ingresosMes - gastosMes

  // --- Donut: gastos por categoría del mes actual ---
  const gastosPorCat = new Map<string, number>()
  for (const t of txMesActual) {
    if (t.type !== 'gasto') continue
    gastosPorCat.set(t.category, (gastosPorCat.get(t.category) ?? 0) + Number(t.amount))
  }
  const donutData = Array.from(gastosPorCat.entries())
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value)

  // --- Barras: ingresos vs gastos últimos 6 meses ---
  const barData: { month: string; ingresos: number; gastos: number }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(currentYear, currentMonth - 5 + i, 1)
    const prefix = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
    let ing = 0
    let gas = 0
    for (const t of transactions) {
      if (!t.date.startsWith(prefix)) continue
      if (t.type === 'ingreso') ing += Number(t.amount)
      else gas += Number(t.amount)
    }
    barData.push({
      month: `${MONTHS_ES_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      ingresos: ing,
      gastos: gas,
    })
  }

  const tituloMes = `${MONTHS_ES_LONG[currentMonth]} ${currentYear}`

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-white/40 mt-0.5 text-sm">Resumen de {tituloMes}</p>
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <SummaryCard
          label="Ingresos del mes"
          value={ingresosMes}
          Icon={TrendingUp}
          color="#4ade80"
        />
        <SummaryCard
          label="Gastos del mes"
          value={gastosMes}
          Icon={TrendingDown}
          color="#f87171"
        />
        <SummaryCard
          label="Balance"
          value={balance}
          Icon={Wallet}
          color={balance >= 0 ? '#4ade80' : '#f87171'}
          signed
        />
      </div>

      {/* Donut */}
      <Section title="Gastos por categoría" subtitle={tituloMes}>
        <GastosDonut data={donutData} />
      </Section>

      {/* Barras */}
      <Section title="Ingresos vs Gastos" subtitle="Últimos 6 meses">
        <IngresosGastosBar data={barData} />
      </Section>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MetasWidget goals={goals} />
        <DeudasWidget debts={deudasActivas} />
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  Icon,
  color,
  signed = false,
}: {
  label: string
  value: number
  Icon: typeof TrendingUp
  color: string
  signed?: boolean
}) {
  const display = signed
    ? `${value >= 0 ? '+' : '-'}${formatCurrency(Math.abs(value))}`
    : formatCurrency(value)
  return (
    <div
      className="rounded-xl border border-white/5 px-5 py-4"
      style={{ backgroundColor: '#1a1d27' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/40">{label}</span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}1f` }}
        >
          <Icon size={14} style={{ color }} strokeWidth={2} />
        </div>
      </div>
      <p
        className="text-xl font-semibold tabular-nums"
        style={{ color: signed ? color : '#fff' }}
      >
        {display}
      </p>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-xl border border-white/5 p-5 mb-4"
      style={{ backgroundColor: '#1a1d27' }}
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-white/35 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function MetasWidget({ goals }: { goals: SavingsGoal[] }) {
  return (
    <div
      className="rounded-xl border border-white/5 p-5"
      style={{ backgroundColor: '#1a1d27' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Metas de ahorro</h2>
        <Link
          href="/ahorros"
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
        >
          Ver todas <ArrowRight size={12} />
        </Link>
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-white/35 py-6 text-center">
          No hay metas activas
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {goals.slice(0, 4).map((g) => {
            const current = Number(g.current_amount)
            const target = Number(g.target_amount)
            const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
            return (
              <li key={g.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-white truncate">{g.name}</span>
                  <span className="text-xs text-white/40 tabular-nums shrink-0">
                    {formatCurrency(current)} /{' '}
                    <span className="text-white/30">
                      {formatCurrency(target)}
                    </span>
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: '#3b7ff5' }}
                  />
                </div>
                <span className="text-xs text-[#3b7ff5] font-semibold tabular-nums">
                  {pct.toFixed(0)}%
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function DeudasWidget({ debts }: { debts: Debt[] }) {
  return (
    <div
      className="rounded-xl border border-white/5 p-5"
      style={{ backgroundColor: '#1a1d27' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Deudas activas</h2>
        <Link
          href="/deudas"
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
        >
          Ver todas <ArrowRight size={12} />
        </Link>
      </div>

      {debts.length === 0 ? (
        <p className="text-sm text-white/35 py-6 text-center">
          Sin deudas activas
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {debts.slice(0, 4).map((d) => {
            const restante =
              Number(d.total_amount) -
              Number(d.installment_amount) * d.paid_installments
            const nextDue = calcularProximoVencimiento(d.due_day)
            return (
              <li
                key={d.id}
                className="flex items-center gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{d.name}</p>
                  <div className="flex items-center gap-1 text-xs text-white/40 mt-0.5">
                    <CalendarClock size={11} />
                    <span>{formatDate(toDateString(nextDue))}</span>
                  </div>
                </div>
                <span
                  className="text-sm font-semibold tabular-nums shrink-0"
                  style={{ color: '#f87171' }}
                >
                  {formatCurrency(Math.max(0, restante))}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
