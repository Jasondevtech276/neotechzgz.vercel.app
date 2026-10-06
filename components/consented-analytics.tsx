'use client'

import { useEffect, useState } from 'react'

const CONSENT_COOKIE = 'neotech_cookie_consent'
const GA_ID = 'G-M0DGWW97PL'
const META_PIXEL_ID = '1232991321352210'

export function ConsentedAnalytics() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    const sync = () => setEnabled(document.cookie.includes(`${CONSENT_COOKIE}=all`))
    sync()
    window.addEventListener('neotech-cookie-consent', sync)
    return () => window.removeEventListener('neotech-cookie-consent', sync)
  }, [])
  useEffect(() => {
    if (!enabled || document.querySelector('[data-neotech-analytics]')) return
    const ga = document.createElement('script')
    ga.async = true
    ga.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    ga.dataset.neotechAnalytics = 'true'
    document.head.appendChild(ga)
    const config = document.createElement('script')
    config.dataset.neotechAnalytics = 'true'
    config.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`
    document.head.appendChild(config)
    const meta = document.createElement('script')
    meta.dataset.neotechAnalytics = 'true'
    meta.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`
    document.head.appendChild(meta)
  }, [enabled])
  return null
}
