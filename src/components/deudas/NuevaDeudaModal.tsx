'use client'

import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { crearDeuda } from '@/app/actions/debts'
import type { DebtType } from '@/types'

const INPUT_CLASS =
  'rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 border border-white/10 outline-none focus:border-[#3b7ff5] transition-colors w-full'

const TYPE_OPTIONS: { value: DebtType; label: string }[] = [
  { value: 'prestamo', label: 'Préstamo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
]

export default function NuevaDeudaModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await crearDeuda(new FormData(formRef.current!))
    setLoading(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    onSuccess()
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-white/10 px-6 pt-6 pb-24 sm:pb-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#1a1d27' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Nueva deuda</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-white/60">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              maxLength={100}
              placeholder="Ej: Préstamo personal Galicia"
              className={INPUT_CLASS}
              style={{ backgroundColor: '#0f1117' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="type" className="text-sm font-medium text-white/60">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              required
              defaultValue="prestamo"
              className={INPUT_CLASS}
              style={{ backgroundColor: '#0f1117' }}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="start_date"
                className="text-sm font-medium text-white/60"
              >
                Fecha de inicio
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={today}
                required
                className={INPUT_CLASS}
                style={{ backgroundColor: '#0f1117', colorScheme: 'dark' }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="total_amount"
                className="text-sm font-medium text-white/60"
              >
                Monto total ($)
              </label>
              <input
                id="total_amount"
                name="total_amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                className={INPUT_CLASS}
                style={{ backgroundColor: '#0f1117' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="installments"
                className="text-sm font-medium text-white/60"
              >
                Cuotas
              </label>
              <input
                id="installments"
                name="installments"
                type="number"
                min="1"
                max="120"
                step="1"
                required
                placeholder="12"
                className={INPUT_CLASS}
                style={{ backgroundColor: '#0f1117' }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="due_day"
                className="text-sm font-medium text-white/60"
              >
                Día de vto.
              </label>
              <input
                id="due_day"
                name="due_day"
                type="number"
                min="1"
                max="31"
                step="1"
                required
                placeholder="10"
                className={INPUT_CLASS}
                style={{ backgroundColor: '#0f1117' }}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white/50 border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: '#3b7ff5' }}
            >
              {loading ? 'Creando...' : 'Crear deuda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
