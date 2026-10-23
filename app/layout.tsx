import type { Metadata, Viewport } from 'next'
import './globals.css'
import './inner-pages.css'
import { CookieConsent } from '@/components/cookie-consent'
import { ConsentedAnalytics } from '@/components/consented-analytics'

const siteUrl = 'https://neotechzgz.vercel.app'

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'NeoTech ZGZ',
  url: siteUrl,
  description: 'Soporte informático, desarrollo web y consultoría tecnológica para profesionales y negocios en Zaragoza y en remoto.',
  email: 'larbimhed260796@gmail.com',
  telephone: '+34684798569',
  areaServed: [
    { '@type': 'City', name: 'Zaragoza' },
    { '@type': 'Country', name: 'España' },
  ],
  knowsAbout: ['Soporte informático', 'Desarrollo web', 'Mantenimiento IT', 'Consultoría tecnológica', 'Ciberseguridad básica'],
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'NeoTech ZGZ | Soporte IT y desarrollo web en Zaragoza',
  description: 'Soporte informático, desarrollo web y consultoría para autónomos y negocios. Servicios remotos y asistencia presencial en Zaragoza, con alcance claro.',
  keywords: ['soporte informático Zaragoza', 'mantenimiento informático', 'desarrollo web Zaragoza', 'consultoría IT', 'asistencia informática'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'NeoTech ZGZ | Soporte IT y desarrollo web en Zaragoza',
    description: 'Soporte informático, desarrollo web y consultoría con alcance claro y soluciones mantenibles.',
    url: siteUrl,
    siteName: 'NeoTech ZGZ',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'NeoTech ZGZ',
    description: 'Soporte informático, desarrollo web y consultoría en Zaragoza.',
  },
}

export const viewport: Viewport = {
  themeColor: '#07111f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c') }}
        />
        {children}
        <CookieConsent />
        <ConsentedAnalytics />
      </body>
    </html>
  )
}
