import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TransaccionesClient from '@/components/transacciones/TransaccionesClient'
import type { Transaction } from '@/types'

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

  return <TransaccionesClient transactions={(data ?? []) as Transaction[]} />
}
