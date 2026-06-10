import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import SWRegister from '@/components/ui/SWRegister'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Finanzas',
  description: 'Control de tus finanzas personales',
  manifest: '/manifest.json',
  applicationName: 'Finanzas',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Finanzas',
  },
  // El equivalente moderno de apple-mobile-web-app-capable para Android/Chrome.
  // Metadata no tiene un campo dedicado, así que lo agregamos como meta crudo.
  other: {
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  // theme-color debe ser un color real: un var() de CSS lo ignora el navegador.
  themeColor: '#0f1117',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={geist.variable}>
      <body className="antialiased">
        {children}
        <SWRegister />
        <Analytics />
      </body>
    </html>
  )
}
