'use client'

import { useEffect, useState } from 'react'

const COOKIE_NAME = 'neotech_cookie_consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setVisible(!document.cookie.includes(`${COOKIE_NAME}=`)) }, [])
  if (!visible) return null
  function choose(value: 'all' | 'essential') {
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=31536000; Path=/; SameSite=Lax`
    window.dispatchEvent(new Event('neotech-cookie-consent')); setVisible(false)
  }
  return <aside className="cookie-banner" role="dialog" aria-label="Preferencias de cookies"><div><p className="eyebrow">COOKIES</p><strong>Tu privacidad, bajo control.</strong><p>Usamos cookies técnicas. Las cookies de analítica y marketing están preparadas, pero no se cargarán sin tu consentimiento.</p><a href="/legal#cookies">Ver política de cookies</a></div><div className="cookie-actions"><button className="button button-quiet" onClick={() => choose('essential')}>Solo necesarias</button><button className="button button-primary" onClick={() => choose('all')}>Aceptar todas</button></div></aside>
}
