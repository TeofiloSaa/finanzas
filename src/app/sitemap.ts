import type { MetadataRoute } from 'next'

const BASE_URL = 'https://finanzas-sand-nu.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  // Solo rutas públicas con valor SEO. /landing es la página principal a indexar;
  // login/register se omiten a propósito (bajo valor SEO, aunque robots las permite).
  return [
    {
      url: `${BASE_URL}/landing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]
}
