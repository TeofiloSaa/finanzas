import type { Metadata } from 'next'

// login/page.tsx es un client component y no puede exportar metadata; este layout
// (server) le adjunta el título y el Open Graph propios de la página.
const TITLE = 'Iniciar sesión — Finanzas'
const DESCRIPTION =
  'Entrá a tu cuenta de Finanzas para seguir tus gastos, ahorros y deudas.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://finanzas-sand-nu.vercel.app/login',
    siteName: 'Finanzas',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
