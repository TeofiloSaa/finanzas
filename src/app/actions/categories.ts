'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { TransactionType } from '@/types'

const DEFAULT_CATEGORIES: { name: string; type: TransactionType; color: string }[] = [
  // Gastos
  { name: 'Comida y super', type: 'gasto', color: '#ef4444' },
  { name: 'Transporte', type: 'gasto', color: '#f97316' },
  { name: 'Ropa', type: 'gasto', color: '#f59e0b' },
  { name: 'Salud', type: 'gasto', color: '#22c55e' },
  { name: 'Entretenimiento', type: 'gasto', color: '#8b5cf6' },
  { name: 'Servicios', type: 'gasto', color: '#06b6d4' },
  { name: 'Educación', type: 'gasto', color: '#3b7ff5' },
  { name: 'Otros', type: 'gasto', color: '#6b7280' },
  // Ingresos
  { name: 'Sueldo', type: 'ingreso', color: '#22c55e' },
  { name: 'Freelance', type: 'ingreso', color: '#3b7ff5' },
  { name: 'Inversiones', type: 'ingreso', color: '#eab308' },
  { name: 'Regalo', type: 'ingreso', color: '#ec4899' },
  { name: 'Otros', type: 'ingreso', color: '#6b7280' },
]

/**
 * Inserta las categorías default si el usuario todavía no tiene ninguna.
 * Idempotente: si ya existe al menos una categoría, no hace nada.
 */
export async function seedDefaultCategories(userId: string) {
  const supabase = await createClient()

  const { count, error: countError } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) return { error: countError.message }
  if (count && count > 0) return { success: true }

  const rows = DEFAULT_CATEGORIES.map((c) => ({
    user_id: userId,
    name: c.name,
    type: c.type,
    color: c.color,
    is_default: true,
  }))

  const { error } = await supabase.from('categories').insert(rows)
  if (error) return { error: error.message }

  return { success: true }
}

export async function crearCategoria(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const name = ((formData.get('name') as string) ?? '').trim()
  const type = formData.get('type') as TransactionType
  const color = ((formData.get('color') as string) ?? '').trim()

  if (!name || (type !== 'gasto' && type !== 'ingreso') || !color) {
    return { error: 'Completá nombre, tipo y color.' }
  }

  // Evitar duplicados del mismo nombre + tipo
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', type)
    .ilike('name', name)
    .maybeSingle()

  if (existing) {
    return { error: 'Ya tenés una categoría con ese nombre.' }
  }

  const { error } = await supabase.from('categories').insert({
    user_id: user.id,
    name,
    type,
    color,
    is_default: false,
  })

  if (error) return { error: error.message }

  revalidatePath('/configuracion')
  revalidatePath('/transacciones')
  return { success: true }
}

export async function eliminarCategoria(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Solo se pueden eliminar categorías custom (is_default = false)
  const { data: cat, error: fetchError } = await supabase
    .from('categories')
    .select('id, is_default')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !cat) return { error: 'No se encontró la categoría.' }
  if (cat.is_default) {
    return { error: 'No se pueden eliminar las categorías predeterminadas.' }
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_default', false)

  if (error) return { error: error.message }

  revalidatePath('/configuracion')
  revalidatePath('/transacciones')
  return { success: true }
}
