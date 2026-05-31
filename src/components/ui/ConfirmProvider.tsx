'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
}

type PendingConfirm = {
  options: ConfirmOptions
  resolve: (answer: boolean) => void
}

const ConfirmContext = createContext<
  ((options: ConfirmOptions) => Promise<boolean>) | null
>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>')
  }
  return ctx
}

export default function ConfirmProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setPending({ options, resolve })
      })
    },
    []
  )

  function handleAnswer(answer: boolean) {
    if (pending) {
      pending.resolve(answer)
      setPending(null)
    }
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <ConfirmModal
          options={pending.options}
          onConfirm={() => handleAnswer(true)}
          onCancel={() => handleAnswer(false)}
        />
      )}
    </ConfirmContext.Provider>
  )
}

function ConfirmModal({
  options,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions
  onConfirm: () => void
  onCancel: () => void
}) {
  const variant = options.variant ?? 'default'
  const confirmBg = variant === 'danger' ? '#dc2626' : '#3b7ff5'

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border-t sm:border border-fg/10 px-6 pt-6 pb-24 sm:pb-6"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        {options.title && (
          <h2 className="text-base font-semibold text-fg mb-2">
            {options.title}
          </h2>
        )}
        <p className="text-sm text-fg/65 mb-5 leading-relaxed">
          {options.message}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-fg/60 border border-fg/10 hover:bg-fg/5 transition-colors cursor-pointer"
          >
            {options.cancelLabel ?? 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-fg transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: confirmBg }}
          >
            {options.confirmLabel ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
