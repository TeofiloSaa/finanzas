import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AhorrosClient from '@/components/ahorros/AhorrosClient'
import type { SavingsGoal } from '@/types'

export const revalidate = 30

export default async function AhorrosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('completed', { ascending: true })
    .order('created_at', { ascending: false })

  return <AhorrosClient goals={(data ?? []) as SavingsGoal[]} />
}
