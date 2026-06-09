import { createClient } from '@supabase/supabase-js'

// Cliente con la service_role key: BYPASSEA Row Level Security.
//
// ⚠️ SOLO PARA USO SERVER-SIDE EN CONTEXTOS SIN SESIÓN DE USUARIO
// (ej. el webhook de Lemon Squeezy, que llega sin cookies de auth y por lo
// tanto no puede pasar las policies `auth.uid() = id`). NUNCA importar este
// módulo desde un Client Component ni exponer SUPABASE_SERVICE_ROLE_KEY al
// browser: tendría acceso total a todas las filas de todos los usuarios.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}
