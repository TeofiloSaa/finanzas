import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutas accesibles sin autenticación.
  // /api/webhooks/* lo consumen servicios externos (Lemon Squeezy) que llegan
  // sin sesión: no deben ser redirigidos a /login.
  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/api/webhooks/',
  ]
  const isPublicRoute = publicRoutes.some((r) => pathname.startsWith(r))

  // Rutas de las que se expulsa al usuario ya autenticado (lo mandamos al dashboard).
  // /reset-password queda afuera a propósito: el link de recuperación crea una sesión
  // y el usuario igual necesita poder cambiar su contraseña sin ser redirigido.
  const redirectIfAuthed = ['/login', '/register', '/forgot-password']
  const isRedirectIfAuthed = redirectIfAuthed.some((r) => pathname.startsWith(r))

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isRedirectIfAuthed) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Excluimos los assets de la PWA (manifest.json y sw.js) además de los
    // estáticos: si el middleware los interceptara, redirigiría a /login y
    // (a) Chrome no detectaría el manifest y (b) el registro del service worker
    // fallaría por venir detrás de un redirect.
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
