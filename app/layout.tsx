import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'NeoTech ZGZ | Tecnología clara para negocios',description:'Soporte IT, desarrollo web y consultoría para negocios que quieren avanzar con sistemas claros y mantenibles.',keywords:['IT','soporte técnico','consultoría','desarrollo web','Zaragoza'],robots:{index:true,follow:true},openGraph:{title:'NeoTech ZGZ | Tecnología clara para negocios',description:'Soporte IT, desarrollo web y consultoría sin complicar lo importante.',type:'website'},twitter:{card:'summary_large_image',title:'NeoTech ZGZ',description:'Tecnología clara para negocios.'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
