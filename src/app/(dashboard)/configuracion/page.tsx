import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { seedDefaultCategories } from '@/app/actions/categories'
import ConfiguracionClient from '@/components/configuracion/ConfiguracionClient'
import type { Category } from '@/types'

export const revalidate = 30

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

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
    <ConfiguracionClient
      email={user.email ?? ''}
      initialFullName={profile?.full_name ?? ''}
      categories={(categories ?? []) as Category[]}
    />
  )
}
