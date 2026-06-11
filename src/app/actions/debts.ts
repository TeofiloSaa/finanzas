'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction, effectivePlan } from '@/lib/plans'
import type { DebtType, Plan } from '@/types'

const LIMITE_FREE = 'Límite del plan Free alcanzado. Upgrade a Pro para continuar.'

export async function crearDeuda(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const name = ((formData.get('name') as string) ?? '').trim()
  const type = formData.get('type') as DebtType
  const total_amount = parseFloat(formData.get('total_amount') as string)
  const installments = parseInt(formData.get('installments') as string)
  const due_day = parseInt(formData.get('due_day') as string)
  const start_date = formData.get('start_date') as string

  if (
    !name ||
    !type ||
    isNaN(total_amount) ||
    total_amount <= 0 ||
    isNaN(installments) ||
    installments < 1 ||
    isNaN(due_day) ||
    due_day < 1 ||
    due_day > 31 ||
    !start_date
  ) {
    return { error: 'Revisá los datos del formulario.' }
  }

  // Límite del plan Free: máximo de deudas activas (no saldadas).
  // paid_installments < installments no se puede comparar columna-vs-columna
  // en un filtro, así que contamos en JS.
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', user.id)
    .maybeSingle()
  const plan = effectivePlan((profile?.plan as Plan) ?? 'free', profile?.plan_expires_at ?? null)

  const { data: existingDebts } = await supabase
    .from('debts')
    .select('installments, paid_installments')
    .eq('user_id', user.id)
  const activas = (existingDebts ?? []).filter(
    (d) => d.paid_installments < d.installments
  ).length

  if (!canPerformAction(plan, 'debts', activas)) {
    return { error: LIMITE_FREE }
  }

  const { error } = await supabase.from('debts').insert({
    user_id: user.id,
    name,
    type,
    total_amount,
    installments,
    paid_installments: 0,
    due_day,
    start_date,
  })

  if (error) return { error: error.message }

  revalidatePath('/deudas')
  return { success: true }
}

export async function eliminarDeuda(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // D1: borrar la deuda DESLIGA sus transacciones de pago (quedan como gastos
  // normales), no las borra. La RPC lo hace atómico.
  const { error } = await supabase.rpc('deuda_eliminar', { p_debt_id: id })

  if (error) return { error: 'No se pudo eliminar la deuda.' }

  revalidatePath('/deudas')
  revalidatePath('/transacciones')
  return { success: true }
}

export async function pagarCuota(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // El monto del pago es el de la cuota (total / cuotas). La validación de
  // "deuda saldada" y el incremento los hace la RPC, atómicamente con la
  // transacción de gasto (categoría 'Pago de deudas').
  const { data: debt, error: readError } = await supabase
    .from('debts')
    .select('id, installment_amount')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (readError || !debt) {
    return { error: 'No se encontró la deuda.' }
  }

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

  const { error } = await supabase.rpc('pago_crear', {
    p_debt_id: id,
    p_amount: debt.installment_amount,
    p_date: date,
  })

  if (error) {
    if (error.message === 'deuda saldada') {
      return { error: 'La deuda ya está saldada.' }
    }
    if (error.message === 'deuda no encontrada') {
      return { error: 'No se encontró la deuda.' }
    }
    return { error: 'No se pudo registrar el pago.' }
  }

  revalidatePath('/deudas')
  revalidatePath('/transacciones')
  return { success: true }
}

export async function revertirPago(paymentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: payment, error: readError } = await supabase
    .from('debt_payments')
    .select('id, debt_id, transaction_id')
    .eq('id', paymentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (readError || !payment) return { error: 'No se encontró el pago.' }

  if (payment.transaction_id) {
    // El despachador borra la transacción, el pago y decrementa paid_installments.
    const { error } = await supabase.rpc('transaccion_eliminar', {
      p_txn: payment.transaction_id,
    })
    if (error) return { error: 'No se pudo revertir el pago.' }
  } else {
    // Pago sin transacción ligada (defensivo): borrar + decrementar.
    const { error: delError } = await supabase
      .from('debt_payments')
      .delete()
      .eq('id', paymentId)
      .eq('user_id', user.id)
    if (delError) return { error: delError.message }

    const { data: debt } = await supabase
      .from('debts')
      .select('id, paid_installments')
      .eq('id', payment.debt_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (debt) {
      await supabase
        .from('debts')
        .update({ paid_installments: Math.max(debt.paid_installments - 1, 0) })
        .eq('id', debt.id)
        .eq('user_id', user.id)
    }
  }

  revalidatePath('/deudas')
  revalidatePath('/transacciones')
  return { success: true }
}
