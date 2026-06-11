'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  DollarSign,
  LogOut,
  Check,
  Tag,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Palette,
  Sun,
  Moon,
  Download,
} from 'lucide-react'
import { updateProfile } from '@/app/actions/profile'
import { logout } from '@/app/actions/auth'
import {
  crearCategoria,
  eliminarCategoria,
  reordenarCategoria,
} from '@/app/actions/categories'
import { exportarCSV, type ExportDataset } from '@/app/actions/export'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import { useTheme, type Theme } from '@/components/ui/ThemeProvider'
import type { Category, TransactionType } from '@/types'

const CURRENCY_KEY = 'finanzas.currency'
const CURRENCIES = [
  { value: 'ARS', label: 'Peso argentino (ARS $)' },
  { value: 'USD', label: 'Dólar estadounidense (USD $)' },
  { value: 'EUR', label: 'Euro (EUR €)' },
]

const PALETTE = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#3b7ff5',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#6b7280',
]

const INPUT_CLASS =
  'rounded-lg px-3 py-2.5 text-sm text-fg placeholder-fg/30 border border-fg/10 outline-none focus:border-[#3b7ff5] transition-colors w-full'

export default function ConfiguracionClient({
  email,
  initialFullName,
  categories,
}: {
  email: string
  initialFullName: string
  categories: Category[]
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [currency, setCurrency] = useState('ARS')
  const [currencySaved, setCurrencySaved] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const confirm = useConfirm()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const stored = localStorage.getItem(CURRENCY_KEY)
    if (stored) setCurrency(stored)
  }, [])

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfileMsg(null)
    setSavingProfile(true)
    const result = await updateProfile(new FormData(formRef.current!))
    setSavingProfile(false)
    if (result?.error) {
      setProfileMsg({ type: 'error', text: result.error })
      return
    }
    setProfileMsg({ type: 'success', text: 'Perfil guardado.' })
    setTimeout(() => setProfileMsg(null), 2500)
  }

  function handleCurrencyChange(value: string) {
    setCurrency(value)
    localStorage.setItem(CURRENCY_KEY, value)
    setCurrencySaved(true)
    setTimeout(() => setCurrencySaved(false), 1800)
  }

  async function handleLogout() {
    const ok = await confirm({
      title: 'Cerrar sesión',
      message: '¿Querés cerrar la sesión en este dispositivo?',
      confirmLabel: 'Cerrar sesión',
    })
    if (!ok) return
    setLoggingOut(true)
    await logout()
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-fg">Configuración</h1>
        <p className="text-fg/40 mt-0.5 text-sm">Ajustes de tu cuenta</p>
      </div>

      {/* Apariencia */}
      <Section title="Apariencia" Icon={Palette}>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg/60">Tema</span>
          <div
            className="flex rounded-lg p-1 gap-1"
            style={{ backgroundColor: 'var(--inset)' }}
          >
            {(
              [
                { value: 'light', label: 'Claro', Icon: Sun },
                { value: 'dark', label: 'Oscuro', Icon: Moon },
              ] as { value: Theme; label: string; Icon: typeof Sun }[]
            ).map(({ value, label, Icon }) => {
              const active = theme === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                  style={{
                    backgroundColor: active ? '#3b7ff5' : 'transparent',
                    color: active ? '#fff' : 'var(--muted)',
                  }}
                >
                  <Icon size={15} strokeWidth={2} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </Section>

      {/* Perfil */}
      <Section title="Perfil" Icon={User}>
        <form
          ref={formRef}
          onSubmit={handleProfileSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg/60">Email</span>
            <div
              className="rounded-lg px-3 py-2.5 text-sm text-fg/60 border border-fg/5 cursor-not-allowed"
              style={{ backgroundColor: 'var(--inset)' }}
            >
              {email}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="full_name"
              className="text-sm font-medium text-fg/60"
            >
              Nombre completo
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              maxLength={120}
              defaultValue={initialFullName}
              placeholder="Tu nombre"
              className={INPUT_CLASS}
              style={{ backgroundColor: 'var(--background)' }}
            />
          </div>

          {profileMsg && (
            <p
              className="text-sm rounded-lg px-3 py-2 border"
              style={{
                color: profileMsg.type === 'success' ? '#4ade80' : '#f87171',
                backgroundColor:
                  profileMsg.type === 'success'
                    ? 'rgba(74,222,128,0.08)'
                    : 'rgba(248,113,113,0.08)',
                borderColor:
                  profileMsg.type === 'success'
                    ? 'rgba(74,222,128,0.2)'
                    : 'rgba(248,113,113,0.2)',
              }}
            >
              {profileMsg.text}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 rounded-lg text-sm font-medium text-fg transition-opacity disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: '#3b7ff5' }}
            >
              {savingProfile ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Section>

      {/* Moneda */}
      <Section title="Moneda" Icon={DollarSign}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="currency" className="text-sm font-medium text-fg/60">
            Moneda predeterminada
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className={INPUT_CLASS}
            style={{ backgroundColor: 'var(--background)' }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between mt-1 min-h-[18px]">
            <p className="text-xs text-fg/30">
              Por ahora solo se guarda la preferencia, no convierte valores.
            </p>
            {currencySaved && (
              <span className="flex items-center gap-1 text-xs text-[#4ade80]">
                <Check size={12} strokeWidth={3} />
                Guardado
              </span>
            )}
          </div>
        </div>
      </Section>

      {/* Categorías */}
      <Section title="Categorías" Icon={Tag}>
        <CategoriasManager categories={categories} />
      </Section>

      {/* Datos */}
      <Section title="Datos" Icon={Download}>
        <ExportData />
      </Section>

      {/* Sesión */}
      <Section title="Sesión" Icon={LogOut}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-fg/50">
            Cerrá la sesión en este dispositivo.
          </p>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-400/30 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-60 shrink-0"
          >
            <LogOut size={14} />
            {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>
      </Section>
    </div>
  )
}

function CategoriasManager({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const confirm = useConfirm()
  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>('gasto')
  const [color, setColor] = useState(PALETTE[0])
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const gastos = categories.filter((c) => c.type === 'gasto')
  const ingresos = categories.filter((c) => c.type === 'ingreso')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Escribí un nombre para la categoría.')
      return
    }
    setAdding(true)
    const formData = new FormData()
    formData.set('name', trimmed)
    formData.set('type', type)
    formData.set('color', color)
    const result = await crearCategoria(formData)
    setAdding(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    setName('')
    setColor(PALETTE[0])
    router.refresh()
  }

  async function handleDelete(cat: Category) {
    const ok = await confirm({
      title: 'Eliminar categoría',
      message: `¿Eliminar la categoría "${cat.name}"? Las transacciones existentes no se borran, pero ya no podrás elegirla.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!ok) return
    setDeletingId(cat.id)
    const result = await eliminarCategoria(cat.id)
    setDeletingId(null)
    if (result?.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  async function handleReorder(cat: Category, direction: 'up' | 'down') {
    setError(null)
    setBusyId(cat.id)
    const result = await reordenarCategoria(cat.id, direction)
    setBusyId(null)
    if (result?.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Formulario */}
      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Nombre de la categoría"
            className={INPUT_CLASS}
            style={{ backgroundColor: 'var(--background)' }}
          />
          <div
            className="flex rounded-lg p-1 gap-1 shrink-0"
            style={{ backgroundColor: 'var(--background)' }}
          >
            {(['gasto', 'ingreso'] as TransactionType[]).map((t) => {
              const active = type === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
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
        </div>

        {/* Paleta de colores */}
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c) => {
            const selected = color === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                className="h-7 w-7 rounded-full cursor-pointer transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  boxShadow: selected
                    ? '0 0 0 2px var(--surface), 0 0 0 4px var(--fg)'
                    : 'none',
                }}
              >
                {selected && (
                  <Check
                    size={14}
                    strokeWidth={3}
                    className="mx-auto text-fg"
                  />
                )}
              </button>
            )
          })}
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={adding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-fg transition-opacity disabled:opacity-60 cursor-pointer"
            style={{ backgroundColor: '#3b7ff5' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            {adding ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      </form>

      {/* Listados */}
      <CategoryGroup
        label="Gastos"
        items={gastos}
        onDelete={handleDelete}
        onReorder={handleReorder}
        deletingId={deletingId}
        busyId={busyId}
      />
      <CategoryGroup
        label="Ingresos"
        items={ingresos}
        onDelete={handleDelete}
        onReorder={handleReorder}
        deletingId={deletingId}
        busyId={busyId}
      />
    </div>
  )
}

function CategoryGroup({
  label,
  items,
  onDelete,
  onReorder,
  deletingId,
  busyId,
}: {
  label: string
  items: Category[]
  onDelete: (cat: Category) => void
  onReorder: (cat: Category, direction: 'up' | 'down') => void
  deletingId: string | null
  busyId: string | null
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-fg/35">
        {label}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-fg/30">Sin categorías.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((cat, i) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2 border border-fg/5"
              style={{ backgroundColor: 'var(--background)' }}
            >
              <span
                className="h-3.5 w-3.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-sm text-fg flex-1 truncate">
                {cat.name}
              </span>
              {cat.is_system ? (
                <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded text-fg/40 border border-fg/10">
                  Sistema
                </span>
              ) : cat.is_default ? (
                <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded text-fg/40 border border-fg/10">
                  Default
                </span>
              ) : (
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => onReorder(cat, 'up')}
                    disabled={i === 0 || busyId === cat.id}
                    aria-label={`Subir ${cat.name}`}
                    className="p-1.5 rounded-md text-fg/30 hover:text-fg hover:bg-fg/8 transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    onClick={() => onReorder(cat, 'down')}
                    disabled={i === items.length - 1 || busyId === cat.id}
                    aria-label={`Bajar ${cat.name}`}
                    className="p-1.5 rounded-md text-fg/30 hover:text-fg hover:bg-fg/8 transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <ChevronDown size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(cat)}
                    disabled={deletingId === cat.id}
                    aria-label={`Eliminar ${cat.name}`}
                    className="p-1.5 rounded-md text-fg/30 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExportData() {
  const [busy, setBusy] = useState<ExportDataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [needsUpgrade, setNeedsUpgrade] = useState(false)

  const datasets: { key: ExportDataset; label: string }[] = [
    { key: 'transacciones', label: 'Transacciones' },
    { key: 'ahorros', label: 'Ahorros' },
    { key: 'deudas', label: 'Deudas' },
  ]

  async function handleExport(dataset: ExportDataset) {
    setError(null)
    setNeedsUpgrade(false)
    setBusy(dataset)
    try {
      const result = await exportarCSV(dataset)
      if ('error' in result) {
        if (result.upgradeRequired) setNeedsUpgrade(true)
        else setError(result.error)
        return
      }
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError('No se pudo generar el archivo. Intentá de nuevo.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-fg/50">
        Descargá tus datos en formato CSV, listos para abrir en Excel o Google
        Sheets.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        {datasets.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleExport(key)}
            disabled={busy !== null}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-fg border border-fg/10 hover:bg-fg/5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--background)' }}
          >
            <Download size={14} strokeWidth={2} />
            {busy === key ? 'Generando...' : label}
          </button>
        ))}
      </div>
      {needsUpgrade && (
        <UpgradePrompt message="Exportar a CSV es parte del plan Pro. Pasate a Pro y descargá tus datos cuando quieras." />
      )}
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  )
}

function Section({
  title,
  Icon,
  children,
}: {
  title: string
  Icon: typeof User
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-xl border border-fg/5 p-5 mb-4"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon size={14} className="text-fg/40" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
      </div>
      {children}
    </section>
  )
}
