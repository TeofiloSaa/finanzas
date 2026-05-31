import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConfiguracionClient from '@/components/configuracion/ConfiguracionClient'

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

  return (
    <ConfiguracionClient
      email={user.email ?? ''}
      initialFullName={profile?.full_name ?? ''}
    />
  )
}
