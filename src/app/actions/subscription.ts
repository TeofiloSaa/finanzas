'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Plan } from '@/types'

const LS_API = 'https://api.lemonsqueezy.com/v1'

function lsHeaders() {
  return {
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
  }
}

// Lee el plan del usuario autenticado. Si no existe fila en profiles
// (no se crea automáticamente al registrarse), default a 'free'.
export async function getUserPlan(): Promise<{
  plan: Plan
  subscriptionId: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { plan: 'free', subscriptionId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, lemon_subscription_id')
    .eq('id', user.id)
    .maybeSingle()

  return {
    plan: (profile?.plan as Plan) ?? 'free',
    subscriptionId: profile?.lemon_subscription_id ?? null,
  }
}

// Verifica el plan de un usuario por id (firma del brief). Solo permite
// consultar el propio plan del usuario autenticado.
export async function getSubscriptionStatus(userId: string): Promise<{
  plan: Plan
  subscriptionId: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) return { plan: 'free', subscriptionId: null }

  return getUserPlan()
}

// Crea un checkout en Lemon Squeezy y devuelve la URL hosteada.
export async function createCheckoutSession(): Promise<
  { url: string } | { error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID

  if (!storeId || !variantId || !process.env.LEMONSQUEEZY_API_KEY) {
    return { error: 'La configuración de pagos no está disponible.' }
  }

  // Origen para el redirect post-compra (vuelve a /pricing).
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const origin = host ? `${proto}://${host}` : ''

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: user.email,
          // Lemon Squeezy normaliza las keys a minúsculas; el webhook lo
          // recupera en meta.custom_data.user_id.
          custom: { user_id: user.id },
        },
        product_options: {
          redirect_url: `${origin}/pricing`,
        },
      },
      relationships: {
        store: { data: { type: 'stores', id: String(storeId) } },
        variant: { data: { type: 'variants', id: String(variantId) } },
      },
    },
  }

  try {
    const res = await fetch(`${LS_API}/checkouts`, {
      method: 'POST',
      headers: lsHeaders(),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      return { error: 'No se pudo iniciar el checkout. Intentá de nuevo.' }
    }

    const json = await res.json()
    const url = json?.data?.attributes?.url
    if (!url) return { error: 'No se pudo iniciar el checkout. Intentá de nuevo.' }

    return { url }
  } catch {
    return { error: 'No se pudo conectar con el procesador de pagos.' }
  }
}

// Cancela la suscripción en Lemon Squeezy. Verifica que la suscripción
// pertenezca al usuario autenticado antes de tocar la API externa. El plan
// se baja a 'free' cuando llegue el webhook subscription_cancelled.
export async function cancelSubscription(
  subscriptionId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('lemon_subscription_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.lemon_subscription_id || profile.lemon_subscription_id !== subscriptionId) {
    return { error: 'No se encontró la suscripción.' }
  }

  if (!process.env.LEMONSQUEEZY_API_KEY) {
    return { error: 'La configuración de pagos no está disponible.' }
  }

  try {
    const res = await fetch(`${LS_API}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: lsHeaders(),
    })

    if (!res.ok) {
      return { error: 'No se pudo cancelar la suscripción. Intentá de nuevo.' }
    }
  } catch {
    return { error: 'No se pudo conectar con el procesador de pagos.' }
  }

  revalidatePath('/pricing')
  return { success: true }
}
