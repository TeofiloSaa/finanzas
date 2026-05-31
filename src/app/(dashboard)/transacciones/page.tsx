import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { seedDefaultCategories } from '@/app/actions/categories'
import TransaccionesClient from '@/components/transacciones/TransaccionesClient'
import type { Transaction, Category } from '@/types'

export const revalidate = 30

export default async function TransaccionesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  let { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (!categories || categories.length === 0) {
    await seedDefaultCategories(user.id)
    const reload = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    categories = reload.data
  }

  return (
    <TransaccionesClient
      transactions={(data ?? []) as Transaction[]}
      categories={(categories ?? []) as Category[]}
    />
  )
}
