'use client'

import { useState, useEffect, useRef } from 'react'
import { User, DollarSign, LogOut, Check } from 'lucide-react'
import { updateProfile } from '@/app/actions/profile'
import { logout } from '@/app/actions/auth'
import { useConfirm } from '@/components/ui/ConfirmProvider'

const CURRENCY_KEY = 'finanzas.currency'
const CURRENCIES = [
  { value: 'ARS', label: 'Peso argentino (ARS $)' },
  { value: 'USD', label: 'Dólar estadounidense (USD $)' },
  { value: 'EUR', label: 'Euro (EUR €)' },
]

const INPUT_CLASS =
  'rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 border border-white/10 outline-none focus:border-[#3b7ff5] transition-colors w-full'

export default function ConfiguracionClient({
  email,
  initialFullName,
}: {
  email: string
  initialFullName: string
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
        <h1 className="text-2xl font-semibold text-white">Configuración</h1>
        <p className="text-white/40 mt-0.5 text-sm">Ajustes de tu cuenta</p>
      </div>

      {/* Perfil */}
      <Section title="Perfil" Icon={User}>
        <form
          ref={formRef}
          onSubmit={handleProfileSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-white/60">Email</span>
            <div
              className="rounded-lg px-3 py-2.5 text-sm text-white/60 border border-white/5 cursor-not-allowed"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
            >
              {email}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="full_name"
              className="text-sm font-medium text-white/60"
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
              style={{ backgroundColor: '#0f1117' }}
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
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60 cursor-pointer"
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
          <label htmlFor="currency" className="text-sm font-medium text-white/60">
            Moneda predeterminada
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className={INPUT_CLASS}
            style={{ backgroundColor: '#0f1117' }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between mt-1 min-h-[18px]">
            <p className="text-xs text-white/30">
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

      {/* Sesión */}
      <Section title="Sesión" Icon={LogOut}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-white/50">
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
      className="rounded-xl border border-white/5 p-5 mb-4"
      style={{ backgroundColor: '#1a1d27' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon size={14} className="text-white/40" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  )
}
