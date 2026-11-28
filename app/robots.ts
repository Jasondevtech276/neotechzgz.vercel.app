import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/account', '/admin', '/login', '/register', '/auth'],
    },
    sitemap: 'https://neotechzgz.vercel.app/sitemap.xml',
  }
}
