import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CookieConsent } from '@/components/cookie-consent';
export const metadata: Metadata={title:'NeoTech ZGZ | Tecnología clara para negocios',description:'Soporte IT, desarrollo web y consultoría para negocios que quieren avanzar con sistemas claros y mantenibles.',keywords:['IT','soporte técnico','consultoría','desarrollo web','Zaragoza'],robots:{index:true,follow:true},openGraph:{title:'NeoTech ZGZ | Tecnología clara para negocios',description:'Soporte IT, desarrollo web y consultoría sin complicar lo importante.',type:'website'},twitter:{card:'summary_large_image',title:'NeoTech ZGZ',description:'Tecnología clara para negocios.'}};
export const viewport: Viewport={themeColor:'#0b1118',width:'device-width',initialScale:1,maximumScale:5};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}<CookieConsent /></body></html>}
