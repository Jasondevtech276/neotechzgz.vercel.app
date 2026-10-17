'use client'

import { useEffect, useState } from 'react'

const CONSENT_COOKIE = 'neotech_cookie_consent'
const GA_ID = 'G-M0DGWW97PL'
const META_PIXEL_ID = '1232991321352210'

type Consent = 'all' | 'essential' | 'analytics' | 'marketing' | null

function readConsent(): Consent {
  const value = document.cookie.split('; ').find((part) => part.startsWith(`${CONSENT_COOKIE}=`))?.split('=')[1]
  return value === 'all' || value === 'essential' || value === 'analytics' || value === 'marketing' ? value : null
}

export function ConsentedAnalytics() {
  const [consent, setConsent] = useState<Consent>(null)

  useEffect(() => {
    const sync = () => setConsent(readConsent())
    sync()
    window.addEventListener('neotech-cookie-consent', sync)
    return () => window.removeEventListener('neotech-cookie-consent', sync)
  }, [])

  useEffect(() => {
    const scripts: HTMLScriptElement[] = []
    const analyticsEnabled = consent === 'all' || consent === 'analytics'
    const marketingEnabled = consent === 'all' || consent === 'marketing'

    // Inject each optional vendor only for the category the visitor selected.
    if (analyticsEnabled && !document.querySelector('[data-neotech-ga]')) {
      const ga = document.createElement('script')
      ga.async = true
      ga.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
      ga.dataset.neotechGa = 'true'
      document.head.appendChild(ga)
      scripts.push(ga)

      const config = document.createElement('script')
      config.dataset.neotechGa = 'true'
      config.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`
      document.head.appendChild(config)
      scripts.push(config)
    }

    if (marketingEnabled && !document.querySelector('[data-neotech-meta]')) {
      const meta = document.createElement('script')
      meta.dataset.neotechMeta = 'true'
      meta.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`
      document.head.appendChild(meta)
      scripts.push(meta)
    }

    return () => {
      // Consent changes that withdraw a category reload the document from the banner.
      // Remove injected bootstrap tags as an additional safeguard for client-side transitions.
      for (const script of scripts) script.remove()
    }
  }, [consent])

  return null
}
