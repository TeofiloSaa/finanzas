'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { LineChart as LineChartIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PatrimonioPoint {
  month: string
  patrimonio: number
}

function formatCompact(v: number): string {
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}k`
  return String(v)
}

function CustomTooltip({
  active,
  payload,
  label,
  color,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  color: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border border-fg/10 px-3 py-2 shadow-xl min-w-[160px]"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <p className="text-xs text-fg/60 mb-1.5">{label}</p>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-fg/60">Patrimonio</span>
        <span className="font-semibold tabular-nums" style={{ color }}>
          {formatCurrency(payload[0].value)}
        </span>
      </div>
    </div>
  )
}

export default function PatrimonioChart({ data }: { data: PatrimonioPoint[] }) {
  // Empty state: hacen falta al menos 2 meses con datos para mostrar evolución.
  if (data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={{ backgroundColor: 'var(--hover)' }}
        >
          <LineChartIcon size={20} className="text-fg/30" strokeWidth={1.75} />
        </div>
        <p className="text-sm text-fg/40">
          Necesitás al menos 2 meses de movimientos
        </p>
      </div>
    )
  }

  // Si el patrimonio cae por debajo de cero en algún mes, todo el gráfico va en rojo.
  const hasNegative = data.some((d) => d.patrimonio < 0)
  const color = hasNegative ? '#f87171' : '#3b7ff5'
  const gradientId = hasNegative ? 'patrimonio-neg' : 'patrimonio-pos'

  return (
    <div className="h-[260px] -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--hover)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            stroke="var(--muted)"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            stroke="var(--muted)"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCompact}
            width={50}
          />
          {hasNegative && (
            <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="2 2" />
          )}
          <Tooltip
            content={<CustomTooltip color={color} />}
            cursor={{ stroke: 'var(--muted)', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="patrimonio"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
