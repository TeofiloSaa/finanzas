'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction, effectivePlan } from '@/lib/plans'
import type { Plan } from '@/types'

const LIMITE_FREE = 'Límite del plan Free alcanzado. Upgrade a Pro para continuar.'

export async function crearMeta(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const name = ((formData.get('name') as string) ?? '').trim()
  const target_amount = parseFloat(formData.get('target_amount') as string)
  const deadlineRaw = ((formData.get('deadline') as string) ?? '').trim()
  const deadline = deadlineRaw || null

  if (!name || isNaN(target_amount) || target_amount <= 0) {
    return { error: 'Completá nombre y monto objetivo.' }
  }

  // Límite del plan Free: máximo de metas activas (no completadas).
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', user.id)
    .maybeSingle()
  const plan = effectivePlan((profile?.plan as Plan) ?? 'free', profile?.plan_expires_at ?? null)

  const { count } = await supabase
    .from('savings_goals')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('completed', false)

  if (!canPerformAction(plan, 'goals', count ?? 0)) {
    return { error: LIMITE_FREE }
  }

  const { error } = await supabase.from('savings_goals').insert({
    user_id: user.id,
    name,
    target_amount,
    current_amount: 0,
    deadline,
    completed: false,
  })

  if (error) return { error: error.message }

  revalidatePath('/ahorros')
  return { success: true }
}

export async function eliminarMeta(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // D1: borrar la meta DESLIGA sus transacciones de aporte (quedan como gastos
  // normales), no las borra. La RPC lo hace atómico.
  const { error } = await supabase.rpc('meta_eliminar', { p_goal_id: id })

  if (error) return { error: 'No se pudo eliminar la meta.' }

  revalidatePath('/ahorros')
  revalidatePath('/transacciones')
  return { success: true }
}

export async function agregarAporte(goalId: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const amount = parseFloat(formData.get('amount') as string)
  const date = formData.get('date') as string

  if (isNaN(amount) || amount <= 0 || !date) {
    return { error: 'Completá monto y fecha.' }
  }

  // Atómico vía RPC: inserta la transacción de gasto (categoría 'Ahorros',
  // auto_origin = 'aporte_ahorro'), el aporte ligado y actualiza la meta en una
  // sola transacción de DB. Reemplaza el insert+update no atómico anterior.
  const { error } = await supabase.rpc('aporte_crear', {
    p_goal_id: goalId,
    p_amount: amount,
    p_date: date,
  })

  if (error) {
    return {
      error: error.message === 'meta no encontrada'
        ? 'No se encontró la meta.'
        : 'No se pudo registrar el aporte.',
    }
  }

  revalidatePath('/ahorros')
  revalidatePath('/transacciones')
  return { success: true }
}

export async function eliminarAporte(contributionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Leemos el aporte para decidir el camino: ligado (nuevo) vs viejo sin transacción.
  const { data: contrib, error: readError } = await supabase
    .from('savings_contributions')
    .select('id, goal_id, amount, transaction_id')
    .eq('id', contributionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (readError || !contrib) return { error: 'No se encontró el aporte.' }

  if (contrib.transaction_id) {
    // Aporte nuevo: el despachador borra la transacción, el aporte y revierte la meta.
    const { error } = await supabase.rpc('transaccion_eliminar', {
      p_txn: contrib.transaction_id,
    })
    if (error) return { error: 'No se pudo eliminar el aporte.' }
  } else {
    // Aporte viejo (no migrado, sin transacción): camino legacy no atómico.
    const { data: goal } = await supabase
      .from('savings_goals')
      .select('id, current_amount, target_amount')
      .eq('id', contrib.goal_id)
      .eq('user_id', user.id)
      .maybeSingle()

    const { error: delError } = await supabase
      .from('savings_contributions')
      .delete()
      .eq('id', contributionId)
      .eq('user_id', user.id)
    if (delError) return { error: delError.message }

    if (goal) {
      const newCurrent = Math.max(
        Number(goal.current_amount) - Number(contrib.amount),
        0
      )
      const completed = newCurrent >= Number(goal.target_amount)
      await supabase
        .from('savings_goals')
        .update({ current_amount: newCurrent, completed })
        .eq('id', goal.id)
        .eq('user_id', user.id)
    }
  }

  revalidatePath('/ahorros')
  revalidatePath('/transacciones')
  return { success: true }
}
