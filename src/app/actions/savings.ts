'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/plans'
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
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()
  const plan = (profile?.plan as Plan) ?? 'free'

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

  const { error } = await supabase
    .from('savings_goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/ahorros')
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

  const { data: goal, error: goalError } = await supabase
    .from('savings_goals')
    .select('id, current_amount, target_amount')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single()

  if (goalError || !goal) {
    return { error: 'No se encontró la meta.' }
  }

  const { error: contribError } = await supabase
    .from('savings_contributions')
    .insert({
      goal_id: goalId,
      user_id: user.id,
      amount,
      date,
    })

  if (contribError) return { error: contribError.message }

  const newCurrent = Number(goal.current_amount) + amount
  const completed = newCurrent >= Number(goal.target_amount)

  const { error: updateError } = await supabase
    .from('savings_goals')
    .update({ current_amount: newCurrent, completed })
    .eq('id', goalId)
    .eq('user_id', user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/ahorros')
  return { success: true }
}
