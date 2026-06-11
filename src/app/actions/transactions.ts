'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction, effectivePlan, isPro } from '@/lib/plans'
import type { Plan, TransactionType } from '@/types'

const LIMITE_FREE = 'Límite del plan Free alcanzado. Upgrade a Pro para continuar.'

type DB = Awaited<ReturnType<typeof createClient>>

const pad = (n: number) => String(n).padStart(2, '0')

// Valida un string 'YYYY-MM-DD' como fecha real (rechaza 2026-02-30, 2026-13-01,
// días fuera de rango, etc.) y devuelve sus componentes, o null si no es válida.
function parseDateParts(
  date: string
): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  // Reconstruir la fecha y verificar que round-trippea descarta combinaciones
  // imposibles (mes 13, 30 de febrero, etc.).
  const d = new Date(year, month - 1, day)
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null
  }
  return { year, month, day }
}

// Primer día del mes y del mes siguiente, como strings 'YYYY-MM-DD'. El conteo
// usa el rango [first, firstNext) sobre la columna date: al estar en ISO con
// padding, la comparación lexicográfica coincide con el orden cronológico.
function monthWindow(
  year: number,
  month: number
): { first: string; firstNext: string } {
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  return {
    first: `${year}-${pad(month)}-01`,
    firstNext: `${nextYear}-${pad(nextMonth)}-01`,
  }
}

// Cuenta las transacciones del usuario cuyo date cae en el mes (year, month).
// excludeId permite no contar una transacción puntual (la que se está editando).
async function countTransactionsInMonth(
  supabase: DB,
  userId: string,
  year: number,
  month: number,
  excludeId?: string
): Promise<number> {
  const { first, firstNext } = monthWindow(year, month)
  // D3: las transacciones automáticas (aportes/pagos) NO cuentan contra el límite
  // Free. Solo se cuentan las manuales (auto_origin null).
  let query = supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('auto_origin', null)
    .gte('date', first)
    .lt('date', firstNext)
  if (excludeId) query = query.neq('id', excludeId)
  const { count } = await query
  return count ?? 0
}

// Devuelve el plan EFECTIVO para el gateo: un Pro vencido (plan_expires_at en el
// pasado) cuenta como Free, así el límite se aplica aunque el webhook de baja
// todavía no haya llegado.
async function readEffectivePlan(supabase: DB, userId: string): Promise<Plan> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .maybeSingle()
  return effectivePlan((profile?.plan as Plan) ?? 'free', profile?.plan_expires_at ?? null)
}

export async function crearTransaccion(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const type = formData.get('type') as TransactionType
  const amount = parseFloat(formData.get('amount') as string)
  const category = formData.get('category') as string
  const description = ((formData.get('description') as string) ?? '').trim() || null
  const date = formData.get('date') as string

  if (!type || isNaN(amount) || amount <= 0 || !category || !date) {
    return { error: 'Completá todos los campos requeridos.' }
  }

  const parsed = parseDateParts(date)
  if (!parsed) {
    return { error: 'La fecha no es válida.' }
  }

  // Límite del plan Free: máximo de transacciones en el mes calendario del date
  // que se está insertando (no del mes actual). Contar contra el mes del date
  // evita el bypass de fechar la transacción en otro mes para esquivar el tope.
  const plan = await readEffectivePlan(supabase, user.id)
  const count = await countTransactionsInMonth(
    supabase,
    user.id,
    parsed.year,
    parsed.month
  )

  if (!canPerformAction(plan, 'transactions', count)) {
    return { error: LIMITE_FREE, upgradeRequired: true }
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    type,
    amount,
    category,
    description,
    date,
  })

  if (error) return { error: error.message }

  revalidatePath('/transacciones')
  return { success: true }
}

export async function editarTransaccion(id: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const type = formData.get('type') as TransactionType
  const amount = parseFloat(formData.get('amount') as string)
  const category = formData.get('category') as string
  const description = ((formData.get('description') as string) ?? '').trim() || null
  const date = formData.get('date') as string

  if (!type || isNaN(amount) || amount <= 0 || !category || !date) {
    return { error: 'Completá todos los campos requeridos.' }
  }

  const parsed = parseDateParts(date)
  if (!parsed) {
    return { error: 'La fecha no es válida.' }
  }

  // Necesitamos el date actual para saber si la edición mueve la transacción de mes,
  // y el auto_origin para no permitir editar transacciones automáticas.
  const { data: current, error: readError } = await supabase
    .from('transactions')
    .select('date, auto_origin')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (readError || !current) {
    return { error: 'No se encontró la transacción.' }
  }

  // Las transacciones automáticas se modifican desde su aporte/pago de origen,
  // no desde el listado: editarlas acá desincronizaría el monto con la meta/deuda.
  if (current.auto_origin) {
    return {
      error: 'Esta transacción se generó automáticamente. Editá el aporte o pago de origen.',
    }
  }

  // Si el date nuevo cae en otro mes, el mes destino tiene que respetar el límite
  // Free igual que una alta nueva: mover una transacción a un mes ya lleno sería
  // un bypass equivalente a crearla ahí. Si el mes no cambia, no se agrega ocupación
  // a ningún mes, así que no hace falta chequear (no bloqueamos editar monto/día).
  const currentParsed = parseDateParts(current.date)
  const mesCambia =
    !currentParsed ||
    currentParsed.year !== parsed.year ||
    currentParsed.month !== parsed.month

  if (mesCambia) {
    const plan = await readEffectivePlan(supabase, user.id)
    if (!isPro(plan)) {
      // Excluimos la propia transacción del conteo del mes destino: hoy vive en su
      // mes viejo, pero excluirla es defensivo ante un date actual corrupto.
      const count = await countTransactionsInMonth(
        supabase,
        user.id,
        parsed.year,
        parsed.month,
        id
      )
      if (!canPerformAction(plan, 'transactions', count)) {
        return { error: LIMITE_FREE, upgradeRequired: true }
      }
    }
  }

  const { error } = await supabase
    .from('transactions')
    .update({ type, amount, category, description, date })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/transacciones')
  return { success: true }
}

export async function eliminarTransaccion(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // D2: si la transacción es automática, el despachador revierte su aporte/pago
  // de origen (borra la fila y ajusta la meta/deuda) además de borrar la fila.
  // Para transacciones manuales, solo borra. Todo atómico en una transacción de DB.
  const { error } = await supabase.rpc('transaccion_eliminar', { p_txn: id })

  if (error) return { error: 'No se pudo eliminar la transacción.' }

  revalidatePath('/transacciones')
  revalidatePath('/ahorros')
  revalidatePath('/deudas')
  return { success: true }
}
