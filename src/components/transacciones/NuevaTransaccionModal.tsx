'use client'

import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { crearTransaccion, editarTransaccion } from '@/app/actions/transactions'
import { formatInputMonto, parseInputMonto } from '@/lib/utils'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import type { Transaction, TransactionType, Category } from '@/types'

const INPUT_CLASS =
  'rounded-lg px-3 py-2.5 text-sm text-fg placeholder-fg/30 border border-fg/10 outline-none focus:border-[#3b7ff5] transition-colors w-full'

export default function NuevaTransaccionModal({
  transaction,
  categories,
  onClose,
  onSuccess,
}: {
  transaction?: Transaction | null
  categories: Category[]
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = !!transaction
  const formRef = useRef<HTMLFormElement>(null)
  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? 'gasto'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsUpgrade, setNeedsUpgrade] = useState(false)
  const [amountDisplay, setAmountDisplay] = useState(() =>
    transaction?.amount != null
      ? formatInputMonto(String(Math.round(Number(transaction.amount))))
      : ''
  )

  const today = new Date().toISOString().split('T')[0]
  const filteredCategories = categories.filter((c) => c.type === type)
  const categoryNames = filteredCategories.map((c) => c.name)
  const initialCategory = transaction?.category

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNeedsUpgrade(false)
    setLoading(true)
    const formData = new FormData(formRef.current!)
    const result = transaction
      ? await editarTransaccion(transaction.id, formData)
      : await crearTransaccion(formData)
    setLoading(false)
    if (result && 'upgradeRequired' in result && result.upgradeRequired) {
      setNeedsUpgrade(true)
      return
    }
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
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-fg">
            {isEdit ? 'Editar transacción' : 'Nueva transacción'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-fg/40 hover:text-fg hover:bg-fg/8 transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg/60">Tipo</span>
            <div
              className="flex rounded-lg p-1 gap-1"
              style={{ backgroundColor: 'var(--background)' }}
            >
              {(['gasto', 'ingreso'] as TransactionType[]).map((t) => {
                const active = type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className="flex-1 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                    style={{
                      backgroundColor: active ? 'var(--surface)' : 'transparent',
                      color: active
                        ? t === 'gasto'
                          ? '#f87171'
                          : '#4ade80'
                        : 'var(--muted)',
                    }}
                  >
                    {t === 'gasto' ? 'Gasto' : 'Ingreso'}
                  </button>
                )
              })}
            </div>
            <input type="hidden" name="type" value={type} />
          </div>

          {/* Fecha y Monto en fila */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="date" className="text-sm font-medium text-fg/60">
                Fecha
              </label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={transaction?.date ?? today}
                required
                className={INPUT_CLASS}
                style={{ backgroundColor: 'var(--background)', colorScheme: 'dark' }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="amount"
                className="text-sm font-medium text-fg/60"
              >
                Monto ($)
              </label>
              <input
                id="amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                required
                autoFocus
                value={amountDisplay}
                onChange={(e) => setAmountDisplay(formatInputMonto(e.target.value))}
                className={INPUT_CLASS}
                style={{ backgroundColor: 'var(--background)' }}
              />
              <input
                type="hidden"
                name="amount"
                value={amountDisplay ? String(parseInputMonto(amountDisplay)) : ''}
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="category"
              className="text-sm font-medium text-fg/60"
            >
              Categoría
            </label>
            <select
              key={type}
              id="category"
              name="category"
              required
              defaultValue={
                initialCategory && categoryNames.includes(initialCategory)
                  ? initialCategory
                  : categoryNames[0]
              }
              className={INPUT_CLASS}
              style={{ backgroundColor: 'var(--background)' }}
            >
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="description"
              className="text-sm font-medium text-fg/60"
            >
              Descripción{' '}
              <span className="text-fg/25 font-normal text-xs">
                (opcional)
              </span>
            </label>
            <input
              id="description"
              name="description"
              type="text"
              placeholder="Ej: Supermercado Coto"
              maxLength={200}
              defaultValue={transaction?.description ?? ''}
              className={INPUT_CLASS}
              style={{ backgroundColor: 'var(--background)' }}
            />
          </div>

          {/* Límite del plan alcanzado → invitación a Pro */}
          {needsUpgrade && (
            <UpgradePrompt message="Llegaste al límite de transacciones del plan Free para ese mes. Pasate a Pro y registrá sin límite." />
          )}

          {/* Error */}
          {error && !needsUpgrade && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Botones */}
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
              {loading
                ? 'Guardando...'
                : isEdit
                  ? 'Guardar cambios'
                  : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
