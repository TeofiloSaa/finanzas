'use client'

import { useState } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setPasswordError(null)

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string

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

  return (
    <div
      className="w-full max-w-sm rounded-2xl border border-fg/8 p-8"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      <h1 className="text-xl font-semibold text-fg mb-1">Crear cuenta</h1>
      <p className="text-sm text-fg/50 mb-6">Empezá a controlar tus finanzas</p>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm text-fg/70 font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            className="rounded-lg px-3 py-2.5 text-sm text-fg placeholder-fg/30 border border-fg/10 outline-none focus:border-[#3b7ff5] transition-colors"
            style={{ backgroundColor: 'var(--background)' }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="full_name" className="text-sm text-fg/70 font-medium">
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            maxLength={120}
            placeholder="Tu nombre"
            className="rounded-lg px-3 py-2.5 text-sm text-fg placeholder-fg/30 border border-fg/10 outline-none focus:border-[#3b7ff5] transition-colors"
            style={{ backgroundColor: 'var(--background)' }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm text-fg/70 font-medium"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            minLength={6}
            className="rounded-lg px-3 py-2.5 text-sm text-fg placeholder-fg/30 border border-fg/10 outline-none focus:border-[#3b7ff5] transition-colors"
            style={{ backgroundColor: 'var(--background)' }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirm_password"
            className="text-sm text-fg/70 font-medium"
          >
            Confirmar contraseña
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            placeholder="••••••••"
            minLength={6}
            className="rounded-lg px-3 py-2.5 text-sm text-fg placeholder-fg/30 border border-fg/10 outline-none focus:border-[#3b7ff5] transition-colors"
            style={{ backgroundColor: 'var(--background)' }}
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
          className="mt-1 rounded-lg py-2.5 text-sm font-medium text-fg transition-opacity disabled:opacity-60 cursor-pointer"
          style={{ backgroundColor: '#3b7ff5' }}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="text-center text-sm text-fg/50 mt-6">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="text-[#3b7ff5] hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  )
}
