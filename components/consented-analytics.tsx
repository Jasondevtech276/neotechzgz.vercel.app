'use client'

import { useEffect, useState } from 'react'

const CONSENT_COOKIE = 'neotech_cookie_consent'
const GA_ID = 'G-M0DGWW97PL'
const META_PIXEL_ID = '1232991321352210'

function readConsent() {
  const value = document.cookie.split('; ').find((part) => part.startsWith(`${CONSENT_COOKIE}=`))?.split('=')[1]
  return {
    analytics: value === 'all' || value === 'analytics',
    marketing: value === 'all' || value === 'marketing',
  }
}

export function ConsentedAnalytics() {
  const [consent, setConsent] = useState({ analytics: false, marketing: false })

  useEffect(() => {
    const sync = () => setConsent(readConsent())
    sync()
    window.addEventListener('neotech-cookie-consent', sync)
    return () => window.removeEventListener('neotech-cookie-consent', sync)
  }, [])

  useEffect(() => {
    if (consent.analytics && !document.querySelector('[data-neotech-ga]')) {
      const ga = document.createElement('script')
      ga.async = true
      ga.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
      ga.dataset.neotechGa = 'true'
      document.head.appendChild(ga)
      const config = document.createElement('script')
      config.dataset.neotechGa = 'true'
      config.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`
      document.head.appendChild(config)
    }

    if (consent.marketing && !document.querySelector('[data-neotech-meta]')) {
      const meta = document.createElement('script')
      meta.dataset.neotechMeta = 'true'
      meta.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`
      document.head.appendChild(meta)
    }
  }, [consent.analytics, consent.marketing])

  return null
}
