'use client'

import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { crearMeta } from '@/app/actions/savings'
import { formatInputMonto, parseInputMonto } from '@/lib/utils'

const INPUT_CLASS =
  'rounded-lg px-3 py-2.5 text-sm text-fg placeholder-fg/30 border border-fg/10 outline-none focus:border-[#3b7ff5] transition-colors w-full'

export default function NuevaMetaModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [amountDisplay, setAmountDisplay] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await crearMeta(new FormData(formRef.current!))
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
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-fg/10 px-6 pt-6 pb-24 sm:pb-6"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-fg">Nueva meta</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-fg/40 hover:text-fg hover:bg-fg/8 transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-fg/60">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              maxLength={100}
              placeholder="Ej: Viaje a Brasil"
              className={INPUT_CLASS}
              style={{ backgroundColor: 'var(--background)' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="target_amount"
              className="text-sm font-medium text-fg/60"
            >
              Monto objetivo ($)
            </label>
            <input
              id="target_amount"
              type="text"
              inputMode="numeric"
              required
              placeholder="0"
              value={amountDisplay}
              onChange={(e) => setAmountDisplay(formatInputMonto(e.target.value))}
              className={INPUT_CLASS}
              style={{ backgroundColor: 'var(--background)' }}
            />
            <input
              type="hidden"
              name="target_amount"
              value={amountDisplay ? String(parseInputMonto(amountDisplay)) : ''}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="deadline"
              className="text-sm font-medium text-fg/60"
            >
              Fecha límite{' '}
              <span className="text-fg/25 font-normal text-xs">
                (opcional)
              </span>
            </label>
            <input
              id="deadline"
              name="deadline"
              type="date"
              className={INPUT_CLASS}
              style={{ backgroundColor: 'var(--background)', colorScheme: 'dark' }}
            />
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
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-fg/50 border border-fg/10 hover:bg-fg/5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-fg transition-opacity disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: '#3b7ff5' }}
            >
              {loading ? 'Creando...' : 'Crear meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
