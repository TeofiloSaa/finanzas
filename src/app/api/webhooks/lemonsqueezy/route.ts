import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { deriveSubscriptionState } from '@/lib/subscription'

// Verifica la firma HMAC-SHA256 del webhook contra el header x-signature.
function verifySignature(raw: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret || !signature) return false

  const digest = crypto.createHmac('sha256', secret).update(raw).digest('hex')

  const a = Buffer.from(digest, 'hex')
  const b = Buffer.from(signature, 'hex')
  if (a.length !== b.length) return false

  return crypto.timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  // Cuerpo crudo: necesario para validar la firma byte a byte.
  const raw = await request.text()

  if (!verifySignature(raw, request.headers.get('x-signature'))) {
    return new Response('Invalid signature', { status: 401 })
  }

  let body: {
    meta?: { custom_data?: { user_id?: string } }
    data?: {
      id?: string | number
      attributes?: { status?: string; ends_at?: string | null; user_email?: string }
    }
  }
  try {
    body = JSON.parse(raw)
  } catch {
    return new Response('Invalid payload', { status: 400 })
  }

  const eventName = request.headers.get('x-event-name')
  const userId = body.meta?.custom_data?.user_id
  const attrs = body.data?.attributes
  const subId = body.data?.id != null ? String(body.data.id) : null

  // Sin user_id no podemos mapear la suscripción a un perfil; respondemos 200
  // para que Lemon Squeezy no reintente indefinidamente.
  if (!userId || !attrs || !subId) {
    return new Response('Ignored', { status: 200 })
  }

  // Solo eventos de suscripción: su data.id ES el id de la suscripción y attributes
  // trae status + ends_at. Los subscription_payment_* se ignoran a propósito: su
  // payload es una invoice (data.id = id de factura, NO de la suscripción) y el
  // cambio de estado que provocan llega igual vía subscription_updated, así que
  // manejarlos acá corrompería lemon_subscription_id.
  const HANDLED_EVENTS = new Set([
    'subscription_created',
    'subscription_updated',
    'subscription_cancelled',
    'subscription_resumed',
    'subscription_expired',
  ])
  if (!HANDLED_EVENTS.has(eventName ?? '')) {
    return new Response('Ignored', { status: 200 })
  }

  // Estado derivado del snapshot del evento (status + ends_at). Misma función pura
  // que usa cancelSubscription, así un webhook duplicado, tardío o posterior a la
  // action converge siempre al mismo estado (idempotencia). Una cancelación con
  // ends_at futuro mantiene plan='pro' + plan_expires_at hasta esa fecha.
  const { plan, planExpiresAt } = deriveSubscriptionState(attrs.status, attrs.ends_at)

  // La fila se identifica por id (PK = uuid de auth.users). No escribimos
  // email: la tabla profiles de esta base no tiene esa columna (el email vive
  // en auth.users), e incluirlo rompía el upsert con 42703.
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').upsert(
    {
      id: userId,
      plan,
      plan_expires_at: planExpiresAt,
      lemon_subscription_id: plan === 'pro' ? subId : null,
    },
    { onConflict: 'id' }
  )

  if (error) {
    console.error('[lemonsqueezy webhook] upsert profiles falló', {
      event: eventName,
      userId,
      plan,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    // Devolvemos el código/mensaje de Postgres en el body para poder
    // diagnosticar desde el "Recent Deliveries" de Lemon Squeezy sin abrir
    // los logs de Vercel. No expone secretos: solo metadata del error de DB.
    return Response.json(
      {
        error: 'Database error',
        code: error.code ?? null,
        message: error.message ?? null,
        details: error.details ?? null,
        hint: error.hint ?? null,
      },
      { status: 500 }
    )
  }

  return new Response('OK', { status: 200 })
}
