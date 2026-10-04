import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'NeoTech ZGZ | Soluciones IT Profesionales & Consultoría 24/7',description:'Soporte técnico remoto y presencial, desarrollo web, consultoría IT enterprise. 6+ años transformando negocios.',keywords:['IT','soporte técnico','consultoría','desarrollo web','Zaragoza'],robots:{index:true,follow:true},openGraph:{title:'NeoTech ZGZ | Soluciones IT Profesionales',description:'Tecnología que impulsa tu negocio.',type:'website'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
