'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface MesData {
  month: string
  ingresos: number
  gastos: number
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border border-white/10 px-3 py-2 shadow-xl min-w-[140px]"
      style={{ backgroundColor: '#0f1117' }}
    >
      <p className="text-xs text-white/60 mb-1.5">{label}</p>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-white/60 capitalize">{entry.name}</span>
            </div>
            <span
              className="font-semibold tabular-nums"
              style={{ color: entry.color }}
            >
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const formatYTick = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return String(v)
}

export default function IngresosGastosBar({ data }: { data: MesData[] }) {
  const hayDatos = data.some((d) => d.ingresos > 0 || d.gastos > 0)

  if (!hayDatos) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        >
          <BarChart3 size={20} className="text-white/30" strokeWidth={1.75} />
        </div>
        <p className="text-sm text-white/40">Sin movimientos en los últimos 6 meses</p>
      </div>
    )
  }

  return (
    <div className="h-[260px] -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            stroke="rgba(255,255,255,0.4)"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.4)"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYTick}
            width={45}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Legend
            iconType="square"
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => (
              <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>
                {value}
              </span>
            )}
          />
          <Bar dataKey="ingresos" fill="#4ade80" radius={[4, 4, 0, 0]} />
          <Bar dataKey="gastos" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
