'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const PALETTE = [
  '#3b7ff5',
  '#f87171',
  '#fbbf24',
  '#4ade80',
  '#a78bfa',
  '#fb923c',
  '#2dd4bf',
  '#f472b6',
]

interface CategoriaData {
  category: string
  value: number
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: CategoriaData; name: string; value: number }>
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div
      className="rounded-lg border border-white/10 px-3 py-2 shadow-xl"
      style={{ backgroundColor: '#0f1117' }}
    >
      <p className="text-xs text-white/60 mb-0.5">{item.payload.category}</p>
      <p className="text-sm font-semibold text-white tabular-nums">
        {formatCurrency(item.value)}
      </p>
    </div>
  )
}

export default function GastosDonut({ data }: { data: CategoriaData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        >
          <PieIcon size={20} className="text-white/30" strokeWidth={1.75} />
        </div>
        <p className="text-sm text-white/40">Sin gastos este mes</p>
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3 sm:gap-4 items-center">
      <div className="relative h-[160px] mx-auto sm:mx-0 w-full max-w-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="category"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-white/40 mb-0.5">Total</p>
          <p className="text-sm font-semibold text-white tabular-nums">
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {data.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0
          return (
            <li key={d.category} className="flex items-center gap-2.5 text-sm">
              <span
                className="shrink-0 w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              />
              <span className="text-white/70 truncate flex-1">{d.category}</span>
              <span className="text-white/40 text-xs tabular-nums shrink-0">
                {pct.toFixed(0)}%
              </span>
              <span className="text-white font-semibold tabular-nums shrink-0 min-w-[80px] text-right">
                {formatCurrency(d.value)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
