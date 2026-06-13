import type { Metadata } from 'next'

// register/page.tsx es un client component y no puede exportar metadata; este layout
// (server) le adjunta el título y el Open Graph propios de la página.
const TITLE = 'Crear cuenta — Finanzas'
const DESCRIPTION =
  'Creá tu cuenta gratis y empezá a ordenar tus gastos, ahorros y deudas con Finanzas.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://finanzas-sand-nu.vercel.app/register',
    siteName: 'Finanzas',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
