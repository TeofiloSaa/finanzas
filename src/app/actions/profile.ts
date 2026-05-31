'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const full_name = ((formData.get('full_name') as string) ?? '').trim() || null

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email!,
        full_name,
      },
      { onConflict: 'id' }
    )

  if (error) return { error: error.message }

  revalidatePath('/configuracion')
  return { success: true }
}
