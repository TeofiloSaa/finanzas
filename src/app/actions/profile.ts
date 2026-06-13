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

  // La tabla profiles no tiene columna email (el email vive en auth.users).
  // La fila se identifica por id (PK = uuid de auth.users).
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name,
      },
      { onConflict: 'id' }
    )

  if (error) {
    console.error('[updateProfile] upsert falló:', error)
    return { error: 'No se pudo actualizar. Intentá de nuevo.' }
  }

  revalidatePath('/configuracion')
  return { success: true }
}
