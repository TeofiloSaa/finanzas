'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SYSTEM_CATEGORIES } from '@/lib/system-categories'
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
 * Inserta las categorías default si el usuario todavía no las tiene.
 * Idempotente: si ya existe al menos una categoría con is_default = true,
 * no inserta nada (evita duplicar las predeterminadas).
 */
export async function seedDefaultCategories() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const userId = user.id

  const { count, error: countError } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_default', true)

  if (countError) return { error: countError.message }
  if (count && count > 0) return { success: true }

  // sort_order incremental por tipo (0, 1, 2... para gastos; 0, 1, 2... para ingresos)
  const counters: Record<TransactionType, number> = { gasto: 0, ingreso: 0 }
  const rows = DEFAULT_CATEGORIES.map((c) => ({
    user_id: userId,
    name: c.name,
    type: c.type,
    color: c.color,
    is_default: true,
    is_system: false,
    sort_order: counters[c.type]++,
  }))

  // Categorías de sistema ('Ahorros', 'Pago de deudas'): gasto, no editables ni
  // borrables. Las usan las transacciones automáticas de aportes/pagos.
  const systemRows = SYSTEM_CATEGORIES.map((c) => ({
    user_id: userId,
    name: c.name,
    type: 'gasto' as TransactionType,
    color: c.color,
    is_default: false,
    is_system: true,
    sort_order: c.sort_order,
  }))

  const { error } = await supabase
    .from('categories')
    .insert([...rows, ...systemRows])
  if (error) return { error: error.message }

  return { success: true }
}

/**
 * Deja una sola categoría por (name + type + user_id): conserva la más antigua
 * según created_at y borra las demás. Repara estados con duplicados previos.
 */
export async function limpiarCategoriasDuplicadas() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const userId = user.id

  const { data: cats, error } = await supabase
    .from('categories')
    .select('id, name, type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) return { error: error.message }
  if (!cats || cats.length === 0) return { success: true }

  const seen = new Set<string>()
  const toDelete: string[] = []

  for (const cat of cats) {
    const key = `${cat.type}::${cat.name.trim().toLowerCase()}`
    if (seen.has(key)) {
      toDelete.push(cat.id)
    } else {
      seen.add(key)
    }
  }

  if (toDelete.length === 0) return { success: true }

  const { error: delError } = await supabase
    .from('categories')
    .delete()
    .eq('user_id', userId)
    .in('id', toDelete)

  if (delError) return { error: delError.message }

  return { success: true, removed: toDelete.length }
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

  // La nueva categoría va al final de su tipo: sort_order = max + 1
  const { data: last } = await supabase
    .from('categories')
    .select('sort_order')
    .eq('user_id', user.id)
    .eq('type', type)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSortOrder = (last?.sort_order ?? -1) + 1

  const { error } = await supabase.from('categories').insert({
    user_id: user.id,
    name,
    type,
    color,
    is_default: false,
    sort_order: nextSortOrder,
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

  // Solo se pueden eliminar categorías custom (is_default = false, is_system = false)
  const { data: cat, error: fetchError } = await supabase
    .from('categories')
    .select('id, is_default, is_system')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !cat) return { error: 'No se encontró la categoría.' }
  if (cat.is_system) {
    return { error: 'No se pueden eliminar las categorías de sistema.' }
  }
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

/**
 * Mueve una categoría custom hacia arriba o abajo dentro de su tipo,
 * intercambiando el sort_order con la categoría adyacente del mismo tipo.
 * Solo aplica a categorías custom (is_default = false).
 */
export async function reordenarCategoria(id: string, direction: 'up' | 'down') {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: target, error: targetError } = await supabase
    .from('categories')
    .select('id, type, is_default, is_system')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (targetError || !target) return { error: 'No se encontró la categoría.' }
  if (target.is_system) {
    return { error: 'Las categorías de sistema no se pueden reordenar.' }
  }
  if (target.is_default) {
    return { error: 'Las categorías predeterminadas no se pueden reordenar.' }
  }

  // Lista ordenada del mismo tipo. Se normaliza el sort_order al vuelo para
  // tolerar valores repetidos heredados (varios en 0, por ejemplo).
  const { data: list, error: listError } = await supabase
    .from('categories')
    .select('id, sort_order, created_at')
    .eq('user_id', user.id)
    .eq('type', target.type)
    .eq('is_system', false)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (listError || !list) return { error: 'No se pudo leer el orden.' }

  const idx = list.findIndex((c) => c.id === id)
  if (idx === -1) return { error: 'No se encontró la categoría.' }

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= list.length) {
    // Ya está en el extremo: nada que hacer.
    return { success: true }
  }

  // Reordena el array y reasigna sort_order = posición (0..n).
  const reordered = [...list]
  ;[reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]]

  const updates = reordered
    .map((c, i) => ({ id: c.id, sort_order: i, old: c.sort_order }))
    .filter((u) => u.sort_order !== u.old)

  for (const u of updates) {
    const { error: updError } = await supabase
      .from('categories')
      .update({ sort_order: u.sort_order })
      .eq('id', u.id)
      .eq('user_id', user.id)
    if (updError) return { error: updError.message }
  }

  revalidatePath('/configuracion')
  revalidatePath('/transacciones')
  return { success: true }
}
