import type { MetadataRoute } from 'next'

const BASE_URL = 'https://finanzas-sand-nu.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // Solo las rutas públicas son indexables. El disallow '/' bloquea todo por
      // defecto (incluidas /dashboard, /transacciones, /ahorros, /deudas, /pricing,
      // /configuracion y cualquier ruta privada futura); los allow más específicos
      // habilitan las públicas por la regla de coincidencia más larga de robots.txt.
      allow: ['/landing', '/login', '/register'],
      disallow: '/',
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
