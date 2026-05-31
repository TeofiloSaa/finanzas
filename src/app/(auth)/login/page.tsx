'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div
      className="w-full max-w-sm rounded-2xl border border-white/8 p-8"
      style={{ backgroundColor: '#1a1d27' }}
    >
      <h1 className="text-xl font-semibold text-white mb-1">Iniciar sesión</h1>
      <p className="text-sm text-white/50 mb-6">Ingresá a tu cuenta de Finanzas</p>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm text-white/70 font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            className="rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 border border-white/10 outline-none focus:border-[#3b7ff5] transition-colors"
            style={{ backgroundColor: '#0f1117' }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm text-white/70 font-medium"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 border border-white/10 outline-none focus:border-[#3b7ff5] transition-colors"
            style={{ backgroundColor: '#0f1117' }}
          />
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
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p className="text-center text-sm text-white/50 mt-6">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="text-[#3b7ff5] hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  )
}
