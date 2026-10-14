import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://neotechzgz.vercel.app'
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/servicios`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/desarrollo-web`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/ciberseguridad`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/mantenimiento`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/planes`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/contacto`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/proyectos`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/sobre-neotech`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/legal`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/login`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/register`, changeFrequency: 'monthly', priority: 0.3 },
  ]
}
