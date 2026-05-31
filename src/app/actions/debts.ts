'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { DebtType } from '@/types'

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

  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/deudas')
  return { success: true }
}

export async function pagarCuota(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: debt, error: readError } = await supabase
    .from('debts')
    .select('id, installments, paid_installments')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (readError || !debt) {
    return { error: 'No se encontró la deuda.' }
  }

  if (debt.paid_installments >= debt.installments) {
    return { error: 'La deuda ya está saldada.' }
  }

  const { error: updateError } = await supabase
    .from('debts')
    .update({ paid_installments: debt.paid_installments + 1 })
    .eq('id', id)
    .eq('user_id', user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/deudas')
  return { success: true }
}
