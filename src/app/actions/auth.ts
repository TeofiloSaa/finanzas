'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validatePassword } from '@/lib/utils'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[login] signIn falló:', error)
    return { error: 'Email o contraseña incorrectos. Revisá tus datos e intentá de nuevo.' }
  }

  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = ((formData.get('full_name') as string) ?? '').trim()

  const passwordError = validatePassword(password ?? '')
  if (passwordError) {
    return { error: passwordError }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })

  if (error) {
    console.error('[register] signUp falló:', error)
    return { error: 'No se pudo crear la cuenta. Intentá de nuevo.' }
  }

  // Con confirmación por email, signUp no crea sesión: el usuario debe
  // confirmar antes de poder entrar. Devolvemos success para que la página
  // muestre la pantalla "Revisá tu email" en vez de redirigir al dashboard.
  return { success: true }
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://finanzas-sand-nu.vercel.app/reset-password',
  })

  if (error) {
    console.error('[forgotPassword] resetPasswordForEmail falló:', error)
    return { error: 'No se pudo enviar el email. Intentá de nuevo.' }
  }

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
