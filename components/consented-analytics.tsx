'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const CONSENT_COOKIE = 'neotech_cookie_consent'
const GA_ID = 'G-M0DGWW97PL'
const META_PIXEL_ID = '1232991321352210'
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST

type PostHogClient = { init: (token: string, options: Record<string, unknown>) => void; capture: (event: string, properties?: Record<string, unknown>) => void }
declare global { interface Window { posthog?: PostHogClient } }

type Consent = 'all' | 'essential' | 'analytics' | 'marketing' | null


function getPostHog(): PostHogClient | undefined {
  return (window as unknown as { posthog?: PostHogClient }).posthog
}

function initializePostHog() {
  if (!POSTHOG_KEY || !POSTHOG_HOST || getPostHog()) return
  const bootstrap = document.createElement('script')
  bootstrap.dataset.neotechPosthog = 'true'
  bootstrap.text = `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+" (stub)"},o="init capture identify alias people.set people.set_once people.unset people.increment people.append people.remove people.group people.resetGroups setPersonProperties setPersonPropertiesForFlags resetGroups setGroupPropertiesForFlags startSessionRecording stopSessionRecording sessionRecordingStarted captureException".split(" ");for(n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);`
  document.head.appendChild(bootstrap)
  getPostHog()?.init(POSTHOG_KEY, { api_host: POSTHOG_HOST, autocapture: false, capture_pageview: false, capture_pageleave: false, disable_session_recording: true, persistence: 'memory', person_profiles: 'identified_only' })
}

function readConsent(): Consent {
  const value = document.cookie.split('; ').find((part) => part.startsWith(`${CONSENT_COOKIE}=`))?.split('=')[1]
  return value === 'all' || value === 'essential' || value === 'analytics' || value === 'marketing' ? value : null
}

export function ConsentedAnalytics() {
  const [consent, setConsent] = useState<Consent>(null)
  const pathname = usePathname()

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

    if (analyticsEnabled) initializePostHog()

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

  useEffect(() => {
    if ((consent === 'all' || consent === 'analytics') && POSTHOG_KEY && POSTHOG_HOST && getPostHog()) {
      // Exclude query strings and fragments to avoid capturing tokens or personal data in URLs.
      getPostHog()?.capture('$pageview', { $current_url: window.location.origin + pathname })
    }
  }, [consent, pathname])

  return null
}
