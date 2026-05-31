'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { TransactionType } from '@/types'

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

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/transacciones')
  return { success: true }
}
