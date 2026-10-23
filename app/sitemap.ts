import type { MetadataRoute } from 'next'

const base = 'https://neotechzgz.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: base + '/soporte-informatico-zaragoza', changeFrequency: 'monthly', priority: 0.9 },
    { url: base + '/servicios', changeFrequency: 'monthly', priority: 0.9 },
    { url: base + '/desarrollo-web', changeFrequency: 'monthly', priority: 0.8 },
    { url: base + '/ciberseguridad', changeFrequency: 'monthly', priority: 0.8 },
    { url: base + '/mantenimiento', changeFrequency: 'monthly', priority: 0.8 },
    { url: base + '/planes', changeFrequency: 'monthly', priority: 0.8 },
    { url: base + '/contacto', changeFrequency: 'monthly', priority: 0.8 },
    { url: base + '/proyectos', changeFrequency: 'monthly', priority: 0.8 },
    { url: base + '/sobre-neotech', changeFrequency: 'monthly', priority: 0.7 },
    { url: base + '/legal', changeFrequency: 'yearly', priority: 0.3 },
  ]
}
