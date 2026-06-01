'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/actions/auth'

function LoginCard() {
  const searchParams = useSearchParams()
  const resetDone = searchParams.get('reset') === 'success'
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
          Bienvenido de vuelta
        </h2>
        <p style={{ fontSize: '13px', color: '#4a5270', marginTop: '6px' }}>
          Ingresá a tu cuenta de Finanzas
        </p>

        {resetDone && (
          <p
            className="text-sm rounded-lg px-3 py-2.5 mt-6"
            style={{
              color: '#7dd3a8',
              backgroundColor: 'rgba(61,191,122,0.1)',
              border: '1px solid rgba(61,191,122,0.2)',
            }}
          >
            Contraseña actualizada, podés ingresar
          </p>
        )}

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
              className="rounded-lg px-3 py-2.5 text-sm outline-none transition-all bg-[#161b2e] border border-[#1e2540] text-[#f0f2ff] placeholder-[#2e3555] focus:border-[#3b7ff5] focus:shadow-[0_0_0_3px_rgba(59,127,245,0.15)]"
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
              placeholder="••••••••"
              className="rounded-lg px-3 py-2.5 text-sm outline-none transition-all bg-[#161b2e] border border-[#1e2540] text-[#f0f2ff] placeholder-[#2e3555] focus:border-[#3b7ff5] focus:shadow-[0_0_0_3px_rgba(59,127,245,0.15)]"
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

        <a
          href="/forgot-password"
          className="block text-center text-sm hover:underline mt-4"
          style={{ color: '#3b7ff5' }}
        >
          ¿Olvidaste tu contraseña?
        </a>
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
        ¿No tenés cuenta?{' '}
        <Link href="/register" style={{ color: '#3b7ff5' }} className="hover:underline">
          Registrate
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginCard />
    </Suspense>
  )
}
