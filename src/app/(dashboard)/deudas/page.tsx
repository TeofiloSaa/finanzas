import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DeudasClient from '@/components/deudas/DeudasClient'
import type { Debt } from '@/types'

export const revalidate = 30

export default async function DeudasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <DeudasClient debts={(data ?? []) as Debt[]} />
}
