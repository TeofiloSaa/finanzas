'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { validatePassword, PASSWORD_RULE_HINT } from '@/lib/utils'

export default function ResetPasswordPage() {
  const router = useRouter()
  // Una sola instancia del browser client: la misma que procesa el hash de la URL
  // debe ser la que llame a updateUser, para compartir la sesión de recuperación.
  const [supabase] = useState(() => createClient())

  const [status, setStatus] = useState<'verifying' | 'ready' | 'invalid'>(
    'verifying'
  )
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const inputClass =
    'rounded-lg px-3 py-2.5 text-sm outline-none transition-all bg-[#161b2e] border border-[#1e2540] text-[#f0f2ff] placeholder-[#2e3555] focus:border-[#3b7ff5] focus:shadow-[0_0_0_3px_rgba(59,127,245,0.15)]'

  useEffect(() => {
    let resolved = false

    const markReady = () => {
      resolved = true
      setStatus('ready')
    }

    // El browser client procesa el hash (#access_token=...&type=recovery) al iniciar
    // y dispara PASSWORD_RECOVERY cuando la sesión de recuperación queda lista.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        markReady()
      }
    })

    // Fallback: si el evento se disparó antes de suscribirnos, igual detectamos la sesión.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) markReady()
    })

    // Si tras unos segundos no hay sesión, el enlace es inválido o expiró.
    const timeout = setTimeout(() => {
      if (!resolved) setStatus('invalid')
    }, 6000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [supabase])

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
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // updateUser deja la sesión de recuperación activa; la cerramos para que el
    // usuario tenga que iniciar sesión con la contraseña nueva (y no caiga al dashboard).
    await supabase.auth.signOut()
    router.push('/login?reset=success')
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
          Nueva contraseña
        </h2>
        <p style={{ fontSize: '13px', color: '#4a5270', marginTop: '6px' }}>
          Elegí una contraseña nueva para tu cuenta
        </p>

        {status === 'verifying' && (
          <div className="flex items-center gap-2.5 mt-7" style={{ color: '#8a92b2' }}>
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Verificando enlace...</span>
          </div>
        )}

        {status === 'invalid' && (
          <div className="mt-7">
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5">
              El enlace de recuperación no es válido o expiró.
            </p>
            <a
              href="/forgot-password"
              className="block text-center text-sm hover:underline mt-4"
              style={{ color: '#3b7ff5' }}
            >
              Pedir un nuevo enlace
            </a>
          </div>
        )}

        {status === 'ready' && (
          <form action={handleSubmit} className="flex flex-col gap-4 mt-7">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium"
                style={{ color: '#8a92b2' }}
              >
                Nueva contraseña
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
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}
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
        ¿Ya la recordaste?{' '}
        <a href="/login" style={{ color: '#3b7ff5' }} className="hover:underline">
          Iniciá sesión
        </a>
      </div>
    </div>
  )
}
