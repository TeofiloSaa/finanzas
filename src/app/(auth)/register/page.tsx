'use client'

import { useState } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'
import { validatePassword, PASSWORD_RULE_HINT } from '@/lib/utils'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setPasswordError(null)

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string

    const rule = validatePassword(password ?? '')
    if (rule) {
      setPasswordError(rule)
      return
    }

    if (password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    const result = await register(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const inputClass =
    'rounded-lg px-3 py-2.5 text-sm outline-none transition-all bg-[#161b2e] border border-[#1e2540] text-[#f0f2ff] placeholder-[#2e3555] focus:border-[#3b7ff5] focus:shadow-[0_0_0_3px_rgba(59,127,245,0.15)]'

  return (
    <div
      className="w-full max-w-sm overflow-hidden"
      style={{
        backgroundColor: '#0f1117',
        border: '1px solid #1e2130',
        borderRadius: '16px',
      }}
    >
      {/* Sección superior */}
      <div style={{ padding: '32px 28px' }}>
        <div
          style={{
            width: '32px',
            height: '2px',
            backgroundColor: '#3b7ff5',
            borderRadius: '2px',
            marginBottom: '24px',
          }}
        />

        <p
          className="uppercase"
          style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            color: '#3b7ff5',
          }}
        >
          Finanzas
        </p>

        <h2
          style={{
            fontSize: '26px',
            fontWeight: 500,
            color: '#f0f2ff',
            letterSpacing: '-0.3px',
            marginTop: '12px',
          }}
        >
          Crear cuenta
        </h2>
        <p style={{ fontSize: '13px', color: '#4a5270', marginTop: '6px' }}>
          Empezá a controlar tus finanzas
        </p>

        <form action={handleSubmit} className="flex flex-col gap-4 mt-7">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium"
              style={{ color: '#8a92b2' }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="full_name"
              className="text-sm font-medium"
              style={{ color: '#8a92b2' }}
            >
              Nombre completo
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              maxLength={120}
              placeholder="Tu nombre"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium"
              style={{ color: '#8a92b2' }}
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              className={inputClass}
            />
            <p style={{ fontSize: '12px', color: '#4a5270' }}>
              {PASSWORD_RULE_HINT}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirm_password"
              className="text-sm font-medium"
              style={{ color: '#8a92b2' }}
            >
              Confirmar contraseña
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              className={inputClass}
            />
            {passwordError && (
              <p className="text-sm text-red-400 mt-0.5">{passwordError}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-60 cursor-pointer"
            style={{ backgroundColor: '#3b7ff5' }}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
      </div>

      {/* Footer del card */}
      <div
        className="text-center text-sm"
        style={{
          borderTop: '1px solid #161b2e',
          backgroundColor: '#0b0e18',
          padding: '16px 28px',
          color: '#2e3555',
        }}
      >
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" style={{ color: '#3b7ff5' }} className="hover:underline">
          Iniciá sesión
        </Link>
      </div>
    </div>
  )
}
