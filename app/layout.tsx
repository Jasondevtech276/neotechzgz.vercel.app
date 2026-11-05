import type { Metadata, Viewport } from 'next'
import './globals.css'
import './inner-pages.css'
import { CookieConsent } from '@/components/cookie-consent'
import { ConsentedAnalytics } from '@/components/consented-analytics'

const siteTitle = 'NeoTech ZGZ | Tecnología clara para negocios'
const siteDescription = 'Soporte IT, desarrollo web y consultoría para profesionales y negocios en Zaragoza y en remoto.'

export const metadata: Metadata = {
  metadataBase: new URL('https://neotechzgz.vercel.app'),
  title: siteTitle,
  description: siteDescription,
  keywords: ['soporte informático Zaragoza', 'soporte IT', 'desarrollo web Zaragoza', 'mantenimiento informático', 'consultoría tecnológica'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: '/',
    siteName: 'NeoTech ZGZ',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
  },
}

export const viewport: Viewport = {
  themeColor: '#0b1118',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <CookieConsent />
        <ConsentedAnalytics />
      </body>
    </html>
  )
}
